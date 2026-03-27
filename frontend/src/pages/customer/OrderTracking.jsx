import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, Utensils, ArrowLeft, Loader2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { SOCKET_BASE_URL, getApiUrl } from '../../config/api';

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Status mapping to UI logic
  const statusSteps = ['Pending', 'Preparing', 'Ready', 'Completed'];
  
  const getStatusIndex = (status) => statusSteps.indexOf(status);

  useEffect(() => {
    // Connect to Socket
    const socket = io(SOCKET_BASE_URL);
    
    // Initial fetch
    const fetchOrder = async () => {
      try {
        const res = await fetch(getApiUrl(`/api/orders/${id}`));
        if (!res.ok) throw new Error("Order not found");
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();

    // Listen to real-time status updates
    socket.on('orderStatusUpdate', (updatedOrder) => {
      if (updatedOrder._id === id) {
        setOrder(updatedOrder);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-background text-primary">
      <Loader2 className="animate-spin text-accent w-12 h-12" />
    </div>
  );

  if (!order) return (
    <div className="flex justify-center items-center h-screen bg-background text-primary">
      <div className="text-center p-8 glass-panel text-red-400">Order not found</div>
    </div>
  );

  const currentStep = getStatusIndex(order.status);

  return (
    <div className="min-h-screen bg-background p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="bg-glow blob-1 fixed w-[400px] h-[400px] rounded-full blur-[100px] bg-accent/20 top-[-100px] left-[-100px] z-0 animate-[pulseGlow_8s_infinite_alternate_ease-in-out]"></div>
      
      <div className="max-w-2xl mx-auto z-10 relative pt-8">
        <Link to={`/menu?table=${order.tableId?.tableNumber || 1}`} className="inline-flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold">
          <ArrowLeft size={20} /> Back to Menu
        </Link>
        
        <div className="glass-panel p-8 text-center animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-surface-hover">
             {/* Progress Bar Line */}
             <div className="h-full bg-accent transition-all duration-1000 ease-out" style={{ width: `${(currentStep / 3) * 100}%` }}></div>
          </div>
          
          <div className="mb-6 flex justify-center">
            {order.status === 'Completed' ? (
              <div className="w-20 h-20 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center animate-bounce">
                <CheckCircle2 size={40} />
              </div>
            ) : order.status === 'Ready' ? (
               <div className="w-20 h-20 rounded-full bg-accentglow text-accent flex items-center justify-center animate-pulse">
                <Utensils size={40} />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center animate-spin-slow">
                <Clock size={40} />
              </div>
            )}
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Order {order.status}</h1>
          <p className="text-secondary">Order ID: <span className="font-mono text-xs opacity-70">{order._id}</span></p>

          {/* Stepper */}
          <div className="flex justify-between items-center mt-12 relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-hover -z-10 -translate-y-1/2 rounded-full hidden sm:block"></div>
            
            {statusSteps.map((step, idx) => (
              <div key={step} className="flex flex-col items-center gap-2 bg-background sm:bg-transparent px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 shadow-lg ${idx <= currentStep ? 'bg-accent text-background shadow-[0_0_10px_var(--accent-glow)]' : 'bg-surface text-secondary border border-border'}`}>
                  {idx + 1}
                </div>
                <span className={`text-xs sm:text-sm font-semibold ${idx <= currentStep ? 'text-primary' : 'text-secondary'}`}>{step}</span>
              </div>
            ))}
          </div>
          
        </div>
        
        {/* Order Details box */}
        <div className="mt-6 glass-panel p-6 animate-fade-in animate-delay-2">
          <h3 className="font-bold text-lg mb-4 border-b border-border pb-2">Order Details</h3>
          <div className="flex flex-col gap-3">
            {order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-accent">{it.quantity}x</span>
                  <span>{it.menuItemId?.name || 'Unknown Item'}</span>
                </div>
                <span className="text-secondary">${(it.quantity * it.priceAtTimeOfOrder).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-border flex justify-between items-center font-bold text-xl">
             <span>Total</span>
             <span className="text-accent gradient-text">${order.totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
