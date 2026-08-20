import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

const Ticks = ({ status = 'SENT', className = 'w-3.5 h-3.5' }) => {
  switch (status) {
    case 'READ':
      return <CheckCheck className={`${className} text-[#53bdeb]`} title="Read" />;
    case 'DELIVERED':
      return <CheckCheck className={`${className} text-[#8696a0]`} title="Delivered" />;
    case 'SENT':
    default:
      return <Check className={`${className} text-[#8696a0]`} title="Sent" />;
  }
};

export default Ticks;
