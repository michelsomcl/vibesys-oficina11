
import React from 'react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Your Project
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-8">
            A clean slate to build something amazing
          </p>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
