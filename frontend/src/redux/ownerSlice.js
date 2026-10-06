import { createSlice } from "@reduxjs/toolkit";
const ownerSlice = createSlice({
    name: "owner",
    initialState: {
        myShopData: null,
        myShopLoaded: false,

    },
    reducers: {
        setMyShopData: (state, action) => {
            state.myShopData = action.payload
            state.myShopLoaded = true
        },

    },
})

export const { setMyShopData } = ownerSlice.actions
export default ownerSlice.reducer