// App.jsx
import "./App.css";
import Pages from "@/pages/index.jsx";
import { Toaster as HotToaster } from "react-hot-toast";
import { LoadScript } from "@react-google-maps/api";

function App() {
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <>
      <Pages />
      {/* react-hot-toast Toaster (position/config optional) */}
      <HotToaster position="top-right" toastOptions={{ duration: 6000 }} />

      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
      </LoadScript>
    </>
  );
}

export default App;
