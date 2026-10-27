export default function Footer() {
  return (
    <footer className="bg-[#031a42] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-2 lg:grid-cols-5">

        {/* BRAND */}
        <div>
          <h2 className="text-2xl font-bold">
            rathi<span className="text-blue-400">academy</span>
          </h2>

          <p className="mt-4 text-sm leading-6 text-slate-300">
            Empowering learners with practical skills,
            real projects and career opportunities.
          </p>

          <div className="mt-6 flex gap-3">

            <a
              href="#"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-800 text-xs font-bold hover:bg-blue-700"
            >
              YT
            </a>

            <a
              href="#"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-800 text-xs font-bold hover:bg-blue-700"
            >
              IG
            </a>

            <a
              href="#"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-800 text-xs font-bold hover:bg-blue-700"
            >
              IN
            </a>

          </div>
        </div>

        {/* COURSES */}
        <FooterColumn
          title="Courses"
          items={[
            "Digital Marketing",
            "Data Analysis",
            "AI Automation",
            "All Programs",
          ]}
        />

        {/* RESOURCES */}
        <FooterColumn
          title="Resources"
          items={[
            "Free Resources",
            "Blog",
            "Guides",
            "Download Brochure",
          ]}
        />

        {/* COMMUNITY */}
        <FooterColumn
          title="Community"
          items={[
            "Discord Community",
            "Live Sessions",
            "Events",
          ]}
        />

        {/* NEWSLETTER */}
        <div>
          <h3 className="font-bold">
            Stay Updated
          </h3>

          <p className="mt-4 text-sm leading-6 text-slate-300">
            Subscribe to get the latest updates,
            new courses and offers.
          </p>

          <div className="mt-5 flex overflow-hidden rounded-lg border border-blue-900">

            <input
              type="email"
              placeholder="Enter your email"
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400"
            />

            <button
              type="button"
              className="bg-blue-600 px-5 font-semibold hover:bg-blue-700"
            >
              →
            </button>

          </div>
        </div>

      </div>

      <div className="border-t border-blue-950 py-5 text-center text-sm text-slate-400">
        © 2026 Rathi Academy. All rights reserved.
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }) {
  return (
    <div>
      <h3 className="font-bold">
        {title}
      </h3>

      <div className="mt-4 space-y-2 text-sm text-slate-300">

        {items.map((item) => (
          <p
            key={item}
            className="cursor-pointer hover:text-white"
          >
            {item}
          </p>
        ))}

      </div>
    </div>
  );
}