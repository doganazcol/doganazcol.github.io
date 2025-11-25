import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About BerkeleyWork',
  description: 'Learn about BerkeleyWork and how it helps UC Berkeley students connect through study sessions',
};

export default function AboutPage() {
  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight mb-6">About BerkeleyWork</h1>
        
        <div className="prose prose-lg dark:prose-invert">
          <p className="lead">
            BerkeleyWork is a collaborative study platform designed specifically for UC Berkeley students to enhance their academic journey through organized study sessions. Our platform facilitates peer-to-peer learning and community building within the Berkeley academic environment.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
          <p>
            To empower Berkeley students by providing a centralized platform where they can easily connect with fellow students, organize study sessions, and create meaningful academic collaborations across all departments and courses.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Key Features</h2>
          <ul>
            <li><strong>Course-Specific Study Sessions:</strong> Create or join study sessions for any Berkeley course</li>
            <li><strong>Flexible Organization:</strong> Schedule sessions with customizable times, locations, and group sizes</li>
            <li><strong>Real-Time Availability:</strong> Browse currently available study sessions and join ones that match your schedule</li>
            <li><strong>Interactive Calendar:</strong> View and manage your study sessions through an intuitive calendar interface</li>
            <li><strong>Private or Public Sessions:</strong> Choose to make your study sessions public or private depending on your preferences</li>
            <li><strong>Progress Tracking:</strong> Monitor your participation and engagement through our rank/badge system</li>
            <li><strong>User-Friendly Interface:</strong> Easy-to-use platform for creating, joining, and managing study sessions</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">How It Works</h2>
          <ol>
            <li><strong>Create Sessions:</strong> Easily set up study sessions by specifying the course, date, time, location, and maximum number of participants</li>
            <li><strong>Join Sessions:</strong> Browse and join available study sessions for your courses</li>
            <li><strong>Collaborate:</strong> Meet with fellow students in person to study together and share knowledge</li>
            <li><strong>Track Progress:</strong> Build your academic community while earning recognition for your participation</li>
          </ol>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Vision</h2>
          <p>
            We believe that learning is enhanced through collaboration. BerkeleyWork aims to break down barriers to group studying by making it simple for Berkeley students to find study partners and create productive learning environments.
          </p>
        </div>
      </div>
    </div>
  );
} 