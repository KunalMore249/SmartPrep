import React from 'react';
import { Clock, Calendar, Brain } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, Student!</h1>
          <p className="text-gray-600">Here's your study overview for today</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          Generate Schedule
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<Clock className="w-6 h-6 text-blue-600" />}
          title="Next Study Slot"
          value="Mathematics"
          subtitle="Today at 2:00 PM"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6 text-green-600" />}
          title="Weekly Progress"
          value="12 Topics"
          subtitle="4 Subjects Covered"
        />
        <StatCard
          icon={<Brain className="w-6 h-6 text-purple-600" />}
          title="Mock Test Score"
          value="85%"
          subtitle="Last Sunday's Test"
        />
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h2>
        <div className="space-y-4">
          {/* Sample schedule items */}
          <ScheduleItem
            time="09:00 AM"
            subject="Physics"
            topic="Quantum Mechanics"
            completed={true}
          />
          <ScheduleItem
            time="11:00 AM"
            subject="Mathematics"
            topic="Calculus"
            completed={true}
          />
          <ScheduleItem
            time="02:00 PM"
            subject="Chemistry"
            topic="Organic Chemistry"
            completed={false}
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, subtitle }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
        <div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-xl font-semibold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

const ScheduleItem = ({ time, subject, topic, completed }) => {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg ${completed ? 'bg-gray-50' : 'bg-white'}`}>
      <div className={`w-3 h-3 rounded-full ${completed ? 'bg-green-500' : 'bg-blue-500'}`} />
      <div className="flex-1">
        <p className="font-medium text-gray-900">{subject}</p>
        <p className="text-sm text-gray-600">{topic}</p>
      </div>
      <div className="text-sm text-gray-500">{time}</div>
    </div>
  );
};

export default Dashboard;