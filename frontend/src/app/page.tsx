    'use client'; // Add this line at the very top

    import Link from 'next/link';
    import { gql, useQuery } from '@apollo/client'; // Keep these imports for testing

    // Define the GraphQL query to test backend connection
    const GET_HELLO_MESSAGE = gql`
      query GetHelloMessage {
        hello
      }
    `;

    export default function HomePage() {
      // Use the useQuery hook to fetch data from the backend
      const { loading, error, data } = useQuery(GET_HELLO_MESSAGE);

      if (loading) return <p className="text-center text-lg text-gray-700">Loading...</p>;
      if (error) return <p className="text-center text-lg text-red-600">Error: {error.message}</p>;

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-8">Welcome to NutriSaas!</h1>
          <p className="text-xl text-gray-700 mb-12 text-center max-w-2xl">
            Your personalized nutrition assistant and administration dashboard.
          </p>

          <div className="flex space-x-6 mb-8">
            <Link href="/login" passHref className="py-3 px-8 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out text-xl font-semibold">
                Login
            </Link>
            <Link href="/signup" passHref className="py-3 px-8 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-300 ease-in-out text-xl font-semibold">
                Sign Up
            </Link>
          </div>

          {/* Display the hello message from your backend */}
          {data && (
            <p className="text-2xl font-bold text-purple-700">Backend says: {data.hello}</p>
          )}
        </div>
      );
    }
    