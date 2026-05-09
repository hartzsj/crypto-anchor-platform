'use client';

import { useEffect, useState } from 'react';

export default function TestApiPage() {
  const [result, setResult] = useState<string>('Loading...');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetch('http://localhost:13001/api/items?take=8')
      .then(res => res.json())
      .then(data => {
        setResult(JSON.stringify(data, null, 2));
      })
      .catch(err => {
        setError(err.message);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test</h1>
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
      <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">{result}</pre>
    </div>
  );
}