import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { Alert } from 'react-native';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const products = await AsyncStorage.getItem('@GoMarketplace:products');
      if (products) {
        setProducts(JSON.parse(products));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(async product => {
    const productExists = products.find(p => p.id === product.id);
    if (productExists) {
      setProducts(products.map((p: Product) => 
        p.id === product.id ? { ...product, quantity: p.quantity + 1 } : p,
      ));
    } else {
      setProducts([...products, { ...product, quantity: 1 }]);
    }
    await AsyncStorage.setItem('@GoMarketplace:products', JSON.stringify(products));
  }, [products]);

  const increment = useCallback(async id => {
    setProducts(products.map((product: Product) => 
      product.id === id ? { ...product, quantity: product.quantity + 1 } : product,
    ));
    await AsyncStorage.setItem('@GoMarketplace:products', JSON.stringify(products));
  }, [products]);

  const decrement = useCallback(async id => {
    const verifyProductQuantity = products.find(p => p.id === id);
    if (verifyProductQuantity && verifyProductQuantity?.quantity > 1) {
      setProducts(products.map((product: Product) => 
        product.id === id ? { ...product, quantity: product.quantity - 1 } : product,
      ));
    }else{
      Alert.alert(
        'Remover Produto',
        'Deseja remover o produto do seu carrinho?😢',
        [
          {text: 'Não', onPress: () => {
            return;
          }, style: 'cancel'},
          {text: 'Sim', onPress: () => {
            setProducts(products.filter(product => product.id !== id));
          }},
        ]
      );
    }
    await AsyncStorage.setItem('@GoMarketplace:products', JSON.stringify(products));
  }, [products]);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
