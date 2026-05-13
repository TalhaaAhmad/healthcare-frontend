import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="bg-[#F2F8F5] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm uppercase tracking-[3px] font-semibold text-[#6C7087] mb-4" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
                Welcome To Zan Center
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-[#000000] mb-6" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>
                Caring For You Before Problems Begin
              </h1>
              <p className="text-lg sm:text-xl text-[#000000] leading-relaxed mb-8" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
                Your trusted partner in women&apos;s health. Book appointments with top specialists, 
                access your medical records, and manage your healthcare journey — all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#001E42] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#002a5c] transition-colors"
                  style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}
                >
                  Patient Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#000000] text-xs font-bold uppercase tracking-[2px] border border-[#000000] hover:bg-[#000000] hover:text-white transition-colors"
                  style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}
                >
                  Register
                </Link>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-72 h-72 sm:w-96 sm:h-96 bg-[#FCE7EC] absolute -top-4 -right-4"></div>
                <div className="relative w-72 h-72 sm:w-96 sm:h-96 bg-[#FFF2E2] flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="Zan Center"
                    width={200}
                    height={200}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#333333] mb-4" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>
              Our Services
            </h2>
            <p className="text-[#666666] max-w-2xl mx-auto" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
              Comprehensive healthcare services tailored for women&apos;s unique needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            <div className="bg-[#F2F8F5] p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#001E42] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#333333] mb-3" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>
                Book Appointments
              </h3>
              <p className="text-sm text-[#666666]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
                Schedule consultations with our expert practitioners at your convenience
              </p>
            </div>
            <div className="bg-[#F4F7FA] p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#001E42] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#333333] mb-3" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>
                Medical Records
              </h3>
              <p className="text-sm text-[#666666]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
                Access your consultation history, prescriptions, and lab results securely
              </p>
            </div>
            <div className="bg-[#FFF2E2] p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#001E42] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#333333] mb-3" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>
                Secure Payments
              </h3>
              <p className="text-sm text-[#666666]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
                Pay for your appointments securely through our integrated payment gateway
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#FCE7EC]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#333333] mb-4" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>
            Ready to Take Charge of Your Health?
          </h2>
          <p className="text-[#666666] mb-8" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
            Join thousands of women who trust Zan Center for their healthcare needs.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 bg-[#001E42] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#002a5c] transition-colors"
            style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}
          >
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#171717] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Zan Center" width={36} height={36} className="object-contain" />
            <span className="text-white text-lg font-semibold" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>
              ZAN CENTER
            </span>
          </div>
          <p className="text-[#6C7087] text-sm" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
            &copy; {new Date().getFullYear()} Zan Center. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
