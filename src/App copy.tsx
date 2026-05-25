import { useState, useEffect } from "react";
import { Sidebar } from "./components/sidebar";
import { Dashboard } from "./components/dashboard";
import { WarehouseManagement } from "./components/warehouse-management";
import { BranchManagement } from "./components/branch-management";
import { ProductManagement } from "./components/product-management";
import { SalesKardex } from "./components/sales-kardex";
import { ShoppingCart } from "./components/shopping-cart";
import { AdminPanel } from "./components/admin-panel";
import { Messaging } from "./components/messaging";
import { ClientPanel } from "./components/client-panel";
import { TransferRoutes } from "./components/transfer-routes";
import { Login } from "./components/login";
import { TopBar } from "./components/top-bar";

export type NavigationItem = 
  | "dashboard"
  | "warehouses"
  | "branches"
  | "products"
  | "sales"
  | "cart"
  | "admin"
  | "messages"
  | "client"
  | "transfers";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "employee" | "client";
  warehouse?: string;
  branch?: string;
  avatar?: string;
}

export default function App() {
  const [activeSection, setActiveSection] = useState<NavigationItem>("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check for remembered user on app load
  useEffect(() => {
    const rememberedUser = localStorage.getItem("rememberedUser");
    if (rememberedUser) {
      try {
        const userData = JSON.parse(rememberedUser);
        setCurrentUser(userData);
        setIsAuthenticated(true);
        
        // Set default section based on user role
        if (userData.role === "client") {
          setActiveSection("client");
        } else {
          setActiveSection("dashboard");
        }
      } catch (error) {
        console.error("Error parsing remembered user:", error);
        localStorage.removeItem("rememberedUser");
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: UserData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    
    // Set appropriate default section based on user role
    if (userData.role === "client") {
      setActiveSection("client");
    } else {
      setActiveSection("dashboard");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveSection("dashboard");
    localStorage.removeItem("rememberedUser");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
      case "warehouses":
        return <WarehouseManagement />;
      case "branches":
        return <BranchManagement />;
      case "products":
        return <ProductManagement />;
      case "sales":
        return <SalesKardex />;
      case "cart":
        return <ShoppingCart />;
      case "admin":
        return <AdminPanel />;
      case "messages":
        return <Messaging />;
      case "client":
        return <ClientPanel />;
      case "transfers":
        return <TransferRoutes />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        currentUser={currentUser}
        onLogout={handleLogout}
        isMobileOpen={isSidebarOpen}
        onMobileToggle={setIsSidebarOpen}
      />
      <main className="flex-1 overflow-auto flex flex-col">
        <TopBar 
          currentUser={currentUser} 
          onLogout={handleLogout}
          onMenuToggle={() => setIsSidebarOpen(true)}
        />
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}