import { CustomUser } from '@/app/api/auth/[...nextauth]/options';
import FileUpload from './FileUpload';

export default function UploadPage({user}: {user: CustomUser | null}) {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Upload Your Health Documents
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your medical reports, test results, or any health-related documents 
            to receive free AI-powered analysis and recommendations. Your documents 
            are kept secure and confidential.
          </p>
        </div>
        
        <FileUpload user={user} />
        
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">1. Upload Documents</h3>
              <p className="text-gray-600 text-sm">
                Securely upload your health reports and medical documents in various formats.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">2. AI Analysis</h3>
              <p className="text-gray-600 text-sm">
                Our advanced AI system analyzes your documents and extracts meaningful health insights.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">3. Get Results</h3>
              <p className="text-gray-600 text-sm">
                Receive easy-to-understand feedback, recommendations, and insights based on your documents.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Note: Our AI consultancy provides general health information and is not a replacement for professional medical advice.
          </p>
        </div>
      </div>
    </main>
  );
}