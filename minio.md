# MinIO Setup for Health Document Upload System

This guide covers setup and configuration of MinIO for your health document AI consulting application.

## 1. Install Required Dependencies

Add the MinIO client and other required dependencies to your Next.js project:

```bash
npm install minio
npm install uuid
```

## 2. Configure Environment Variables

Create a `.env.local` file in your project root with the MinIO configurations provided in the environment setup artifact.

## 3. Run MinIO Server (Development)

For local development, you can run MinIO using Docker:

```bash
docker run -p 9000:9000 -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  -v minio-data:/data \
  minio/minio server /data --console-address ":9001"
```

This starts a MinIO server on port 9000 with a web console accessible at port 9001.

## 4. Implementation

1. Create the API route at `app/api/upload/route.ts` using the code provided in the MinIO Upload API artifact.

2. Add the `FileUpload.tsx` component to your UI from the Document Upload Component artifact.

3. Import and use the FileUpload component in your page:

```tsx
// app/upload/page.tsx
import FileUpload from '@/components/FileUpload';

export default function UploadPage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Upload Your Health Documents
      </h1>
      <FileUpload />
    </main>
  );
}
```

## 5. Production Deployment

For production, consider:

1. Using a managed MinIO service or S3-compatible storage
2. Setting up proper authentication for document access
3. Configuring secure transport (SSL/TLS)
4. Implementing bucket lifecycle policies for data retention

Update your environment variables accordingly for production deployments.

## Security Considerations

- Always validate file types and sizes
- Implement user authentication before allowing uploads
- Set up proper IAM policies in MinIO
- Consider encrypting sensitive health documents at rest
- Implement proper access controls for the uploaded files
- Set up appropriate backup strategies

## Additional Features to Consider

- Document preview functionality
- Virus/malware scanning before storage
- Document versioning
- Multi-user access controls
- Audit logging for compliance purposes