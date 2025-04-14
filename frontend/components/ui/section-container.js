import React from 'react'

export function SectionContainer({ children, icon, title, description, className = "" }) {
  return (
    <div className={`p-6 ${className}`}>
      <div className="max-w-screen-lg mx-auto">
        {(icon || title) && (
          <div className="flex items-center space-x-2 mb-6">
            {icon && React.cloneElement(icon, { className: "h-6 w-6" })}
            {title && <h2 className="text-2xl font-bold">{title}</h2>}
          </div>
        )}
        
        {description && (
          <p className="text-muted-foreground mb-8">{description}</p>
        )}
        
        {children}
      </div>
    </div>
  )
}
