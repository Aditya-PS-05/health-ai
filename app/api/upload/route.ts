// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'minio';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';

// Set up MinIO client
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'health-documents';

// Ensure the bucket exists
async function ensureBucketExists() {
  const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
  if (!bucketExists) {
    await minioClient.makeBucket(BUCKET_NAME, process.env.MINIO_REGION || 'us-east-1');
    
    // Set bucket policy to private
    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          Condition: {
            StringLike: { 's3:prefix': 'user-documents/' }
          }
        }
      ]
    }));
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize bucket if it doesn't exist
    await ensureBucketExists();

    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get file metadata
    const buffer = Buffer.from(await file.arrayBuffer());
    const userId = formData.get('userId') as string || 'anonymous';
    const originalFilename = file.name;
    const fileExtension = path.extname(originalFilename);
    
    // Create a unique filename
    const uniqueFilename = `${randomUUID()}${fileExtension}`;
    const objectName = `user-documents/${userId}/${uniqueFilename}`;
    
    // Save file to temporary location
    const tempFilePath = path.join(os.tmpdir(), uniqueFilename);
    await writeFile(tempFilePath, buffer);
    
    // Upload to MinIO
    await minioClient.fPutObject(
      BUCKET_NAME,
      objectName,
      tempFilePath,
      {
        'Content-Type': file.type,
        'X-Amz-Meta-Original-Filename': originalFilename,
        'X-Amz-Meta-User-Id': userId,
      }
    );

    // Generate a pre-signed URL for temporary access (expires in 1 hour)
    const presignedUrl = await minioClient.presignedGetObject(
      BUCKET_NAME, 
      objectName, 
      60 * 60  // 1 hour expiry
    );

    return NextResponse.json({
      success: true,
      fileId: uniqueFilename,
      filename: originalFilename,
      url: presignedUrl,
      path: objectName
    });
    
  } catch (error) {
    console.error('Error uploading file to MinIO:', error);
    return NextResponse.json(
      { error: 'File upload failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Optional: Add a GET method to check if the upload endpoint is working
export async function GET() {
  return NextResponse.json({ status: 'Upload endpoint operational' });
}