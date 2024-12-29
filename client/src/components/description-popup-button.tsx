import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface DescriptionPopupButtonProps {
  description: ReactNode;
}

const DescriptionPopupButton: React.FC<DescriptionPopupButtonProps> = ({ description }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
      >
        詳細資訊
      </Button>

      {isOpen && (
        <Card
          className="absolute left-full ml-2 top-0 w-64 shadow-lg z-50"
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-gray-100 ml-auto"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2">
              {description}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DescriptionPopupButton;