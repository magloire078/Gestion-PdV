import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface POSState {
    cart: CartItem[];
    addItem: (product: { id: string; name: string; price: number }) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
}

export const usePOSStore = create<POSState>()(
    // persist(
    (set, get) => ({
        cart: [],
        total: 0,
        addItem: (product) => {
            const cart = get().cart;
            const existingItem = cart.find((item) => item.id === product.id);

            let newCart;
            if (existingItem) {
                newCart = cart.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                newCart = [...cart, { ...product, quantity: 1 }];
            }

            set({
                cart: newCart,
                total: newCart.reduce((acc, item) => acc + item.price * item.quantity, 0),
            });
        },
        removeItem: (id) => {
            const newCart = get().cart.filter((item) => item.id !== id);
            set({
                cart: newCart,
                total: newCart.reduce((acc, item) => acc + item.price * item.quantity, 0),
            });
        },
        updateQuantity: (id, quantity) => {
            const newCart = get().cart.map((item) =>
                item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
            ).filter(item => item.quantity > 0);

            set({
                cart: newCart,
                total: newCart.reduce((acc, item) => acc + item.price * item.quantity, 0),
            });
        },
        clearCart: () => set({ cart: [], total: 0 }),
    })
    //     ,
    //     {
    //         name: 'pos-storage',
    //         storage: createJSONStorage(() => {
    //             if (typeof window !== 'undefined') {
    //                 return window.localStorage;
    //             }
    //             return {
    //                 getItem: () => null,
    //                 setItem: () => { },
    //                 removeItem: () => { },
    //                 clear: () => { },
    //                 key: () => null,
    //                 length: 0,
    //             };
    //         }),
    //     }
    // )
);
