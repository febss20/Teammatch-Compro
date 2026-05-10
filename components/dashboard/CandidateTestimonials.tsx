"use client";

import React from 'react';
import { Star, MessageCircle, Users, Trophy } from 'lucide-react';

interface CandidateTestimonialsProps {
  candidate: {
    profile: {
      id: string;
      fullName: string | null;
      username: string | null;
      bio: string | null;
      campusName: string | null;
    };
    compatibilityScore: number;
    testimonialAverage: number;
    testimonialCount: number;
    competitionsCount: number;
    bestResult: string | null;
  };
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
}

export function CandidateTestimonials({ candidate, testimonials }: CandidateTestimonialsProps) {
  const { profile, testimonialAverage, testimonialCount, competitionsCount, bestResult } = candidate;

  return (
    <div className="space-y-6">
      {/* Profile Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Ringkasan Profil</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>Kompatibilitas: {candidate.compatibilityScore}%</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {testimonialAverage.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Rating Rata-rata</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <MessageCircle className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {testimonialCount}
            </div>
            <div className="text-sm text-gray-600">Testimoni</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-6 w-6 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {competitionsCount}
            </div>
            <div className="text-sm text-gray-600">Kompetisi</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 truncate">
              {bestResult || '-'}
            </div>
            <div className="text-sm text-gray-600">Hasil Terbaik</div>
          </div>
        </div>
      </div>

      {/* Testimoni Detail */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Testimoni</h3>
        
        {testimonials.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p className="text-gray-500">Belum ada testimoni untuk {profile.fullName || profile.username}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="border-l-4 border-blue-200 pl-4 py-4">
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
                    <span className="text-gray-600 font-medium text-xs">
                      {testimonial.author.full_name?.charAt(0).toUpperCase() || testimonial.author.username?.charAt(0).toUpperCase() || '?'}
                    </span>
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
                    
                    <p className="text-xs text-gray-500 mt-2">
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
          </div>
        )}
      </div>
    </div>
  );
}
