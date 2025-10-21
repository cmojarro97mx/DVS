import React from 'react';
import { Card } from './Card';

const StatusBadge = ({ status }: { status: 'Delivered' | 'Canceled' | 'Active' }) => {
  const colorClasses = {
    Delivered: 'bg-green-100 text-green-800',
    Canceled: 'bg-red-100 text-red-800',
    Active: 'bg-yellow-100 text-yellow-800',
  };
  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${colorClasses[status]}`}>
      {status}
    </span>
  );
};

const shippingData: any[] = [];

export const LatestShippingCard = () => {
  return (
    <Card title="Latest Shipping" viewAll>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">ORDER ID</th>
              <th scope="col" className="px-6 py-3">STATUS</th>
              <th scope="col" className="px-6 py-3">CUSTOMER</th>
              <th scope="col" className="px-6 py-3">DEPARTURE</th>
              <th scope="col" className="px-6 py-3">WEIGHT</th>
              <th scope="col" className="px-6 py-3">ARRIVAL</th>
              <th scope="col" className="px-6 py-3">ARRIVAL DATE</th>
            </tr>
          </thead>
          <tbody>
            {shippingData.length > 0 ? (
              shippingData.map((item, index) => (
                <tr key={index} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.id}</td>
                  <td className="px-6 py-4"><StatusBadge status={item.status as any} /></td>
                  <td className="px-6 py-4">{item.customer}</td>
                  <td className="px-6 py-4">{item.departure}</td>
                  <td className="px-6 py-4">{item.weight}</td>
                  <td className="px-6 py-4">{item.arrival}</td>
                  <td className="px-6 py-4">{item.date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  No recent shipping activity.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};