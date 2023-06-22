import React from 'react';

const ConsumerItem = ({ consumer }) => {
  const { name, type } = consumer;

  // Render different icon based on consumer type
  const renderIcon = () => {
    if (type === 'text') {
      return <TextIcon />;
    } else if (type === 'component') {
      return <ComponentIcon />;
    } else {
      return <DefaultIcon />;
    }
  };

  return (
    <div>
      {renderIcon()}
      <span>{name}</span>
    </div>
  );
};

export default ConsumerItem;