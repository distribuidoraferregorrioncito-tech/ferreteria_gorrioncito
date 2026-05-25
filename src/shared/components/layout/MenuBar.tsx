interface MenuBar {
    id: string;
    label: string;
    icon: string;
    subItems?: MenuBar[];
}

const initialMenu: MenuBar[] = [
    { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    {
        id: "inventory",
        label: "Inventario",
        icon: "Package",
        subItems: [
            { id: "warehouses", label: "Almacenes", icon: "Warehouse" },
            { id: "products", label: "Productos", icon: "Package2" }
        ]
    }
];