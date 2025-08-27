import React from 'react'

interface IconButtonProps {
  icon: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  'aria-label'?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'primary' | 'danger'
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
  size = 'md',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const variantClasses = {
    default: 'bg-white hover:bg-gray-50 text-gray-700',
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        inline-flex items-center justify-center
        rounded-full border border-gray-200
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
    >
      {icon}
    </button>
  )
}

export default IconButton
