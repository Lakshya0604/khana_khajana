import { createSlice } from "@reduxjs/toolkit";
const userSlice = createSlice({
    name: "user",
    initialState: {
        userData: null,
        city: null,
        state: null,
        currentAddress: null,
        shopsInMyCity: [],
        itemsInMyCity: null,
        cartItems: [],
        totalAmount: 0,
        myOrders: [],
        searchItems: null,
        socket: null
    },
    reducers: {
        setUserData: (state, action) => {
            state.userData = action.payload
        },
        setCity: (state, action) => {
            state.city = action.payload
        },
        setState: (state, action) => {
            state.state = action.payload
        },
        setCurrentAddress: (state, action) => {
            state.currentAddress = action.payload
        },
        setShopsInMyCity: (state, action) => {
            state.shopsInMyCity = action.payload
        },
        setItemsInMyCity: (state, action) => {
            state.itemsInMyCity = action.payload
        },
        setSocket: (state, action) => {
            state.socket = action.payload
        },
        addToCart: (state, action) => {
            const cartItem = action.payload
            const itemId = cartItem.id || cartItem._id
            const existingItem = state.cartItems.find(i => i.id === itemId)
            const quantityToAdd = cartItem.quantity > 0 ? cartItem.quantity : 1
            if (existingItem) {
                existingItem.quantity += quantityToAdd
            } else {
                state.cartItems.push({ ...cartItem, id: itemId, quantity: quantityToAdd })
            }
            state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
        },
        updateQuantity: (state, action) => {
            const { id, quantity } = action.payload
            const item = state.cartItems.find(i => i.id == id)
            if (item) {
                item.quantity = quantity
            }
            state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
        },
        removeCartItem: (state, action) => {
            state.cartItems = state.cartItems.filter(i => i.id !== action.payload)
            state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
        },
        setMyOrders: (state, action) => {
            state.myOrders = action.payload
        },
        addMyOrder: (state, action) => {
            state.myOrders = [action.payload, ...state.myOrders]
        },
        updateOrderStatus: (state, action) => {
            const { orderId, shopId, status } = action.payload
            const order = state.myOrders.find(o => o._id == orderId)
            if (order) {
                if (order.shopOrders && order.shopOrders.shop._id == shopId) {
                    order.shopOrders.status = status
                }
            }
        },
        updateRealtimeOrderStatus: (state, action) => {
            const { orderId, shopId, status } = action.payload
            const order = state.myOrders.find(o => o._id == orderId)
            if (order) {
                if (Array.isArray(order.shopOrders)) {
                    const shopOrder = order.shopOrders.find(so => String(so.shop._id) == String(shopId))
                    if (shopOrder) shopOrder.status = status
                } else if (order.shopOrders && order.shopOrders.shop && String(order.shopOrders.shop._id) == String(shopId)) {
                    order.shopOrders.status = status
                }
            }
        },
        updateAssignedDeliveryBoy: (state, action) => {
            const { orderId, shopId, assignedDeliveryBoy } = action.payload
            const order = state.myOrders.find(o => o._id == orderId)
            if (order) {
                if (Array.isArray(order.shopOrders)) {
                    const shopOrder = order.shopOrders.find(so => String(so.shop._id) == String(shopId))
                    if (shopOrder) shopOrder.assignedDeliveryBoy = assignedDeliveryBoy
                } else if (order.shopOrders && order.shopOrders.shop && String(order.shopOrders.shop._id) == String(shopId)) {
                    order.shopOrders.assignedDeliveryBoy = assignedDeliveryBoy
                }
            }
        },
        setSearchItems: (state, action) => {
            state.searchItems = action.payload
        }

    }
})

export const { setUserData, setCity, setState, setCurrentAddress, setShopsInMyCity, setItemsInMyCity, addToCart, updateQuantity, removeCartItem, totalAmount, setMyOrders, addMyOrder, updateOrderStatus, setSearchItems, setSocket, updateRealtimeOrderStatus, updateAssignedDeliveryBoy } = userSlice.actions
export default userSlice.reducer