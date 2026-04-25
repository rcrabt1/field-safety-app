import AboutBanner from '../components/AboutBanner';
import ObservationForm from '../components/form/ObservationForm';

export default function FormPage() {
  return (
    <>
      <AboutBanner page="form" />
      <div className="bg-gray-50 min-h-screen pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Safety Observation</h1>
          <p className="text-gray-500 text-sm mt-1">Complete all required fields (*) and submit. Average completion time: under 5 minutes.</p>
        </div>
        <ObservationForm />
      </div>
    </>
  );
}
