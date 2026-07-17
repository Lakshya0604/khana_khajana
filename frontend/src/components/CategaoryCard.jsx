import React from 'react'

const CategaoryCard = ({ name, image, onClick }) => {
    return (
        <div className='w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] md:w-[150px] md:h-[150px] rounded-2xl border-2 border-[#ff4d2d] shrink-0 overflow-hidden bg-white shadow-xl shadow-gray-200 hover:shadow-lg transition-shadow relative cursor-pointer' onClick={onClick}>
            <img src={image} alt="" className='w-full h-full object-cover transform hover:scale-110 transition-transform duration-300' />
            <div className='absolute bottom-0 w-full left-0 bg-[#ffffff96] bg-opacity-95 px-2 sm:px-3 py-1 rounded-xl text-center shadow text-xs sm:text-sm font-medium text-gray-800 backdrop-blur'>
                {name}
            </div>
        </div>
    )
}

export default CategaoryCard