"use client";

import React, { useState } from 'react';
import { Star, MessageCircle } from 'lucide-react';

interface TestimonialDisplayProps {
  testimonials: Array<{
    id: string;
    author: {
      full_name: string | null;
      username: string | null;
    };
    target_profile_id: string;
    rating: number;
    body: string;
    created_at: string;
    team?: {
      name: string;
    };
  }>;
  maxDisplay?: number;
}

export function TestimonialsDisplay({ testimonials, maxDisplay = 3 }: TestimonialDisplayProps) {
  const [showAll, setShowAll] = useState(false);
  const displayTestimonials = showAll ? testimonials : testimonials.slice(0, maxDisplay);
  
  if (displayTestimonials.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <MessageCircle className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">Belum ada testimoni</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayTestimonials.map((testimonial) => (
        <div key={testimonial.id} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start space-x-4">
            <div className="shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600 font-medium text-sm">
                  {testimonial.author.full_name?.charAt(0).toUpperCase() || testimonial.author.username?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{testimonial.author.full_name || testimonial.author.username}</h4>
                  {testimonial.team?.name && (
                    <p className="text-sm text-gray-500">Tim: {testimonial.team.name}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < testimonial.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {testimonial.rating}.0
                  </span>
                </div>
              </div>
              
              <p className="text-gray-700 text-sm leading-relaxed">
                {testimonial.body}
              </p>
              
              <p className="text-xs text-gray-500 mt-3">
                {new Date(testimonial.created_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      ))}
      
      {testimonials.length > maxDisplay && (
        <div className="text-center mt-4">
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            {showAll ? 'Tampilkan Lebih Sedikit' : `Lihat ${testimonials.length - maxDisplay} testimoni lagi`}
          </button>
        </div>
      )}
    </div>
  );
}
