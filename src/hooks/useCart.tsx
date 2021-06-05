import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const cartList = [...cart]
      const find = cartList.find((cart) => cart.id === productId);
      if (find) {
        const updateProduct: UpdateProductAmount = {
          amount: find.amount + 1,
          productId: find.id
        }
        updateProductAmount(updateProduct);
        return;
      }

      const { data: product } = await api.get(`products/${productId}`)
      const { data: stock } = await api.get(`stock/${productId}`)

      if (stock < 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      const newProduct = { ...product, amount: 1 }
      cartList.push(newProduct);

      setCart(cartList)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartList))
    } catch {
      toast.error('Erro na adição do produto');

    }
  };

  const removeProduct = (productId: number) => {
    try {
      const index = cart.findIndex(c => c.id === productId);
      if (index < 0)
        throw Error();

      cart.splice(index, 1);

      setCart([...cart]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if (amount < 1)
        return;

      const { data: stock } = await api.get(`stock/${productId}`)

      if (stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      const find = cart.find(v => v.id === productId)
      if (!find) {
        throw Error()
      }
      find.amount = amount;
      setCart([...cart])
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
