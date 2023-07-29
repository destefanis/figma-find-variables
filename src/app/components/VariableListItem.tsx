import React from 'react';
import booleanIcon from '../assets/boolean.svg';
import stringIcon from '../assets/string.svg';
import numberIcon from '../assets/number.svg';
import colorIcon from '../assets/color.svg';
import defaultIcon from '../assets/string.svg';

const VariableListItem = ({ variable }) => {
  const { name, type, value } = variable;

  // console.log(value);

  let iconSrc = defaultIcon;

  switch (type) {
    case 'boolean':
      iconSrc = booleanIcon;
      break;
    case 'string':
      iconSrc = stringIcon;
      break;
    case 'number':
      iconSrc = numberIcon;
      break;
    case 'color':
      iconSrc = colorIcon;
      break;
    default:
      break;
  }

  function handleSelectAll(nodeArray, name) {
    const arrays = Object.values(nodeArray);

    // Flatten the arrays into a single array using Array.prototype.flat
    const combinedArray = arrays.flat();

    parent.postMessage(
      {
        pluginMessage: {
          type: "select-multiple-layers",
          nodeArray: combinedArray,
          name: name,
        }
      },
      "*"
    );
  }

  function handleSelect(nodeArray, name, nodeType) {
    parent.postMessage(
      {
        pluginMessage: {
          type: "select-multiple-layers",
          nodeArray: nodeArray,
          name: name,
          nodeType: capitalizeFirstLetter(nodeType)
        }
      },
      "*"
    );
  }

  function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  return (
    <li className="list-item" key={variable.index}>
      <div className="variable-list-item">
        <div className="column column-1 border-right">
          <div className="item-content item-content-clickable" onClick={() => handleSelectAll(variable.groupedConsumers, name)}>
            <img className="style-icon" src={iconSrc} alt={type} />
            <div className="item-name">{name}</div>
          </div>
          <div className="subitem-content">
            <ul className="consumer-sublist">
              {Object.entries(variable.groupedConsumers).map(([nodeType, nodeIds]) => (
                <li
                  className="consumer-sublist-item item-content-clickable"
                  key={`${variable.name}-${nodeType}`}
                  onClick={() => handleSelect(nodeIds, name, nodeType)}
                >
                  <img
                    className="sublist-item-icon"
                    src={require(`../assets/icon-16-${nodeType.toLowerCase()}.svg`)}
                  />
                  <span className="sublist-item-label">
                    {capitalizeFirstLetter(nodeType)} Layers <span className="sublist-item-count">· {nodeIds.length}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="column column-2">
          <div className="item-content">
            {variable.cssSyntax !== null && (
              <div
                className="color-indicator"
                style={{ backgroundColor: variable.cssSyntax }}
              ></div>
            )}
            <div className="item-value">{value}</div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default VariableListItem;