import { useEffect } from 'react';
import Head from 'next/head';

export default function PrivacyPolicy() {
  useEffect(() => {
    // Create and append the Usercentrics script
    const script = document.createElement('script');
    script.id = 'usercentrics-ppg';
    script.setAttribute('privacy-policy-id', '2c0692a2-f52c-443b-a3f9-8745e685391a');
    script.src = 'https://policygenerator.usercentrics.eu/api/privacy-policy';
    script.async = true;

    // Append to body (or head if preferred)
    document.body.appendChild(script);

    // Cleanup function to remove script when component unmounts
    return () => {
      const existingScript = document.getElementById('usercentrics-ppg');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>Privacy Policy</title>
        <meta name="description" content="Our privacy policy and data protection information" />
      </Head>

      <div className="container">
        <main className="main-content">
          <h1>Privacy Policy</h1>
          
          {/* Usercentrics Privacy Policy Container */}
          <div className="uc-privacy-policy"></div>
        </main>

        <style jsx>{`
          .container {
            min-height: 100vh;
            padding: 2rem;
            background-color: #f9fafb;
          }

          .main-content {
            max-width: 1000px;
            margin: 0 auto;
            background-color: white;
            padding: 3rem;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          h1 {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 2rem;
            color: #111827;
          }

          .uc-privacy-policy {
            line-height: 1.6;
            color: #374151;
          }

          @media (max-width: 768px) {
            .container {
              padding: 1rem;
            }

            .main-content {
              padding: 1.5rem;
            }

            h1 {
              font-size: 2rem;
            }
          }
        `}</style>
      </div>
    </>
  );
}