import { Route } from "react-router-dom";
import { ProtectedRoute } from "../../../app/routes/ProtectedRoutes"
import ProductPage from "../pages/ProductPage";

export default [
    <Route key="product" path="/product" element={<ProductPage/>} />

];