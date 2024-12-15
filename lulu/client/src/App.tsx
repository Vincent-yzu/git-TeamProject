import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import Dashboard from "@/pages/dashboard";
import HomePage from "@/pages/home"; // 引入 HomePage
import MyTripPage from "@/pages/my-trip"; // 引入 MyTripPage
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient();

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/my-trip" element={<MyTripPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
      <Toaster />
    </>
  );
}

export default App;
