import ObservationForm from '../components/form/ObservationForm';

export default function FormPage() {
  return (
    <div className="bg-surface min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <h1 className="text-xl font-bold text-gray-900">Safety Observation</h1>
        <p className="text-gray-500 text-sm mt-0.5">Click through at your own pace. Every field here is optional.</p>
        <p className="text-gray-400 text-xs mt-2">Demo form. Nothing submitted here is a real safety record.</p>
      </div>
      <ObservationForm />
    </div>
  );
}
