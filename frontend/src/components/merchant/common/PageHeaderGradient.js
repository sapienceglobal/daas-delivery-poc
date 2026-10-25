'use client';

import React from 'react';

/**
 * Reusable PageHeaderGradient
 * Signature atmospheric ambient red gradient at the top of merchant pages,
 * perfectly matching the brand identity in both light and dark modes.
 */
export default function PageHeaderGradient({
  className = '',
  height = 'h-[360px]',
  badgeIcon: BadgeIcon,
  badgeText,
  title,
  subtitle,
  actions,
  children,
  withBackground = true,
}) {
  const hasContent = Boolean(badgeText || title || subtitle || actions || children);

  return (
    <div className={`relative ${hasContent ? 'pt-2 px-1' : ''} ${className}`}>
      {/* Signature ambient atmospheric red gradient at the top */}
      {withBackground && (
        <div
          className={`absolute top-0 left-0 right-0 ${height} pointer-events-none -z-10 overflow-hidden`}
          style={{
            maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
          }}
        >
          {/* Light mode: clean, subtle luxury ambient header wash without muddy pink blotch */}
          <div
            className="dark:hidden absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(254, 242, 242, 0.35) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)',
            }}
          />
          <div
            className="dark:hidden absolute top-0 right-0 w-2/3 h-full pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 70% 55% at 75% 10%, rgba(205, 19, 27, 0.04) 0%, transparent 75%)',
            }}
          />

          {/* Dark mode: deep luxury red brand ambient sheen */}
          <div
            className="hidden dark:block absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(205, 19, 27, 0.14) 0%, rgba(122, 11, 16, 0.05) 50%, transparent 100%)',
            }}
          />
          <div
            className="hidden dark:block absolute top-0 right-0 w-3/4 h-full pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 75% 65% at 75% 15%, rgba(205, 19, 27, 0.24) 0%, rgba(122, 11, 16, 0.12) 45%, transparent 75%)',
            }}
          />
          <div
            className="hidden dark:block absolute top-0 left-0 w-1/2 h-full pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 20% 0%, rgba(205, 19, 27, 0.18) 0%, transparent 75%)',
            }}
          />
        </div>
      )}

      {/* Header Content */}
      {hasContent && (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
          <div className="space-y-1">
            {badgeText && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold font-outfit mb-1.5">
                {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5" />}
                <span>{badgeText}</span>
              </div>
            )}
            {title && (
              <h1 className="text-2xl sm:text-3xl font-extrabold text-admin-text tracking-tight font-outfit">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-admin-text-secondary max-w-2xl font-medium leading-relaxed">
                {subtitle}
              </p>
            )}
            {children}
          </div>

          {actions && (
            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
