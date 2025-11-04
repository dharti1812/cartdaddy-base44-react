import "./App.css";
import Pages from "@/pages/index.jsx";
import { Toaster } from "@/components/ui/toaster";
import { LoadScript } from "@react-google-maps/api";


function App() {
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <>
      <Pages />
      <Toaster />

      <LoadScript
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        libraries={["places"]}
      >
       
      </LoadScript>
    </>
  );
}

export default App;
