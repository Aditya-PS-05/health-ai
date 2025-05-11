// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'minio';
import { randomUUID } from 'crypto';
import { writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

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
    console.log("form data: ", formData);
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get file metadata
    const buffer = Buffer.from(await file.arrayBuffer());
    const userId = parseInt(formData.get('userId') as string) || null;
    const documentType = formData.get('documentType') as string || null;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate that the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get file details
    const originalFilename = file.name;
    const fileSize = file.size;
    const mimeType = file.type;
    const fileExtension = path.extname(originalFilename);
    
    // Create a unique filename for storage
    const fileId = randomUUID();
    const uniqueFilename = `${fileId}${fileExtension}`;
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
        'Content-Type': mimeType,
        'X-Amz-Meta-Original-Filename': originalFilename,
        'X-Amz-Meta-User-Id': userId.toString(),
      }
    );

    // Generate a pre-signed URL for temporary access (expires in 1 hour)
    const presignedUrl = await minioClient.presignedGetObject(
      BUCKET_NAME, 
      objectName, 
      60 * 60  // 1 hour expiry
    );

    // Parse tags if any
    const tagsInput = formData.get('tags') as string || '';
    const tags = tagsInput.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    // Store file details in the database
    const document = await prisma.document.create({
      data: {
        user_id: userId,
        original_filename: originalFilename,
        file_id: fileId,
        file_size: fileSize,
        mime_type: mimeType,
        file_extension: fileExtension,
        storage_path: objectName,
        storage_bucket: BUCKET_NAME,
        public_url: presignedUrl,
        document_type: documentType,
        tags: tags,
      },
    });

    // If document type is provided, automatically create an analysis request
    if (documentType) {
      await prisma.analysis.create({
        data: {
          user_id: userId,
          document_id: document.id,
          status: 'pending',
          analysis_type: 'document_analysis',
          version: '1.0',
        },
      });
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileId: fileId,
        filename: originalFilename,
        url: presignedUrl,
        documentType: documentType,
        uploadedAt: document.uploaded_at,
      }
    });
    
  } catch (error) {
    console.error('Error uploading file to MinIO:', error);
    return NextResponse.json(
      { error: 'File upload failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Optional: Add a GET method to fetch user's documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);
    
    // Fetch documents for the user
    const documents = await prisma.document.findMany({
      where: {
        user_id: userIdNum,
        is_deleted: false,
      },
      orderBy: {
        uploaded_at: 'desc',
      },
      include: {
        analyses: {
          select: {
            id: true,
            status: true,
            analysis_type: true,
            completed_at: true,
          }
        }
      }
    });

    // For each document, generate a fresh presigned URL
    const updatedDocuments = await Promise.all(documents.map(async (doc) => {
      let presignedUrl = null;
      
      try {
        presignedUrl = await minioClient.presignedGetObject(
          doc.storage_bucket,
          doc.storage_path,
          60 * 15  // 15 minutes expiry
        );
      } catch (err) {
        console.error(`Error generating URL for document ${doc.id}:`, err);
      }
      
      return {
        ...doc,
        public_url: presignedUrl,
      };
    }));

    return NextResponse.json({
      success: true,
      documents: updatedDocuments,
    });
    
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: (error as Error).message },
      { status: 500 }
    );
  }
}