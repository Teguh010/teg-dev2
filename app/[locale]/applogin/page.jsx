'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { apiAuth } from '@/models/common'

// Component that uses useSearchParams must be wrapped in Suspense
const AutoLoginContent = () => {
  const searchParams = useSearchParams()
  const UserContext = useUser()
  const { setUser } = UserContext.operations
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const autoLogin = async () => {
      try {
        // Get parameters from URL
        const username = searchParams.get('username')
        const password = searchParams.get('password')
        const customer = searchParams.get('company')

        // Validate parameters
        if (!username || !password || !customer) {
          setError('Missing login parameters. Please provide username, password, and company.')
          setIsLoading(false)
          return
        }

        // Attempt login using the apiAuth function from models/common
        const result = await apiAuth(username, password, customer);
        toast.success('Login Successful');

        // Create user data object
        const userData = {
          token: result.access_token,
          username,
          password,
          customer,
          role: 'user' // Explicitly set role
        };

        // Set user data in context
        setUser(userData);
        
        // Store in client-specific storage
        localStorage.setItem('userData-client', JSON.stringify(userData));
        localStorage.setItem('current-role', 'user');
        
        // Remove any old generic userData if it exists
        localStorage.removeItem('userData');
        
        // Redirect to menu screen page
        window.location.assign('/menu-screen');
      } catch (error) {
        console.error('Auto-login error:', error);
        if (error.message && error.message.includes('401')) {
          setError('Authentication failed. Invalid credentials.');
        } else if (error.message && error.message.includes('503')) {
          setError('Server maintenance. Please try again later.');
        } else {
          setError('Connection error. Please check your internet connection.');
        }
        setIsLoading(false);
      }
    }

    autoLogin()
  }, [searchParams, setUser])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">TraceGrid Auto Login</h1>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-gray-600">Logging you in...</p>
          </div>
        ) : error ? (
          <div className="p-4 border border-red-300 bg-red-50 rounded-md">
            <p className="text-red-600 font-medium">Login Error</p>
            <p className="text-red-500">{error}</p>
            <div className="mt-4">
              <a href="/" className="text-primary hover:underline">
                Go to login page
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

// Main page component with Suspense boundary
const AutoLoginPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6">TraceGrid Auto Login</h1>
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <AutoLoginContent />
    </Suspense>
  )


}

export default AutoLoginPage
