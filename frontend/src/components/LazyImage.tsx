import React, { useState, useRef, useEffect } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  delay?: number
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = "",
  loading = "lazy",
  onError,
  delay = 0
}) => {
  const [actualSrc, setActualSrc] = useState<string>("")
  const [shouldLoad, setShouldLoad] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (delay > 0) {
      // Staggered loading with delay
      timeoutRef.current = window.setTimeout(() => {
        setShouldLoad(true)
        setActualSrc(src)
      }, delay)
    } else {
      setShouldLoad(true)
      setActualSrc(src)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [src, delay])

  useEffect(() => {
    if (loading === 'lazy' && imgRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && shouldLoad) {
              setActualSrc(src)
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.1 }
      )
      
      observer.observe(imgRef.current)
      
      return () => observer.disconnect()
    }
  }, [src, loading, shouldLoad])

  return (
    <img
      ref={imgRef}
      src={actualSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={onError}
    />
  )
}

export default LazyImage
