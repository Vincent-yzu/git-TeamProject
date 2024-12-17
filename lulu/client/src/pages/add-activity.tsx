import ItineraryForm from '../components/itinerary-form'

export default function Home() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Travel Itinerary Planner</h1>
      <p className="mb-4">Click the button below to start creating your travel itinerary.</p>
      <ItineraryForm />
    </div>
  )
}

