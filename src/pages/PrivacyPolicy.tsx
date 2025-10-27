import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
          style={{ color: 'hsl(var(--neon-green))' }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-6 text-glow-green" style={{ color: 'hsl(var(--neon-green))' }}>
          Privacy Policy
        </h1>

        <Card className="bg-gray-900 border-gray-800 p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">1. Introduction</h2>
            <p className="text-gray-400 leading-relaxed">
              Welcome to PlayOps. We are committed to protecting your privacy and handling your data in an open and transparent manner. This privacy policy sets out how we collect, use, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">2. Data We Collect</h2>
            <p className="text-gray-400 leading-relaxed">
              We may collect the following types of information:
            </p>
            <ul className="list-disc list-inside text-gray-400 mt-2 space-y-1">
              <li><strong>Personal Identification Information:</strong> Name, email address, wallet address, etc.</li>
              <li><strong>Usage Data:</strong> Information on how you use the platform, including game results, time spent, and features used.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, operating system, etc.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">3. How We Use Your Data</h2>
            <p className="text-gray-400 leading-relaxed">
              Your data is used to:
            </p>
            <ul className="list-disc list-inside text-gray-400 mt-2 space-y-1">
              <li>Provide and maintain our service.</li>
              <li>Notify you about changes to our service.</li>
              <li>Allow you to participate in interactive features of our service.</li>
              <li>Provide customer support.</li>
              <li>Gather analysis or valuable information so that we can improve our service.</li>
              <li>Monitor the usage of our service.</li>
              <li>Detect, prevent and address technical issues.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">4. Data Security</h2>
            <p className="text-gray-400 leading-relaxed">
              The security of your data is important to us. We use various security measures to protect your personal information, including encryption and secure servers. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">5. Your Rights</h2>
            <p className="text-gray-400 leading-relaxed">
              You have the right to access, update, or delete the information we have on you. You can do this by accessing your account settings or by contacting us directly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">6. Changes to This Policy</h2>
            <p className="text-gray-400 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
}