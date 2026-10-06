import React from 'react'

// Shown while data is loading, so pages never flash "no items" before the data arrives.
const Spinner = ({ label = 'Loading...', className = '' }) => (
    <div className={`w-full flex flex-col items-center justify-center gap-3 py-10 text-gray-500 ${className}`} role='status' aria-live='polite'>
        <div className='h-9 w-9 rounded-full border-4 border-orange-200 border-t-[#ff4d2d] animate-spin' />
        <span className='text-sm'>{label}</span>
    </div>
)

export default Spinner
