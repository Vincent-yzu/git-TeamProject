import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface DescriptionPopupProps {
  description: ReactNode;
}

const DescriptionPopup: React.FC<DescriptionPopupProps> = ({ description }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
        {description}
    </div>
  );
};

export default DescriptionPopup;