figma.showUI(__html__, { width: 443, height: 580 });

// Variables object we'll use for storing all the variables
// found in our page.
let variablesInUse = {
  name: "Variables",
  variables: [],
};

figma.ui.onmessage = (msg) => {

  // When the user presses the button in the default or empty state.
  if (msg.type === 'find-variables') {
    function determineFill(fills) {
      let fillValues = [];

      fills.forEach(fill => {
        if (fill.type === "SOLID") {
          let rgbObj = convertColor(fill.color);
          fillValues.push(RGBToHex(rgbObj["r"], rgbObj["g"], rgbObj["b"]));
        } else if (fill.type === "IMAGE") {
          fillValues.push("Image - " + fill.imageHash);
        } else if (fill.type === "VIDEO") {
          fillValues.push("Video Fill");
        } else {
          const gradientValues = [];
          fill.gradientStops.forEach(gradientStops => {
            let gradientColorObject = convertColor(gradientStops.color);
            gradientValues.push(
              RGBToHex(
                gradientColorObject["r"],
                gradientColorObject["g"],
                gradientColorObject["b"]
              )
            );
          });
          let gradientValueString = gradientValues.toString();
          gradientValueString = gradientValueString.replace(/,/g, ", ");
          let gradientType = null;

          if (fill.type === "GRADIENT_LINEAR") {
            gradientType = "Linear Gradient";
          } else if (fill.type === "GRADIENT_RADIAL") {
            gradientType = "Radial Gradient";
          } else if (fill.type === "GRADIENT_ANGULAR") {
            gradientType = "Angular Gradient";
          } else if (fill.type === "GRADIENT_DIAMOND") {
            gradientType = "Diamond Gradient";
          }

          fillValues.push(`${gradientType} ${gradientValueString}`);
        }
      });

      return fillValues[0];
    }

    // Utility functions for color conversion.
    const convertColor = color => {
      const colorObj = color;
      const figmaColor = {};

      Object.entries(colorObj).forEach(cf => {
        const [key, value] = cf;

        if (["r", "g", "b"].includes(key)) {
          figmaColor[key] = (255 * (value as number)).toFixed(0);
        }
        if (key === "a") {
          figmaColor[key] = value;
        }
      });
      return figmaColor;
    };

    // Convert the fill info from the API into a hex value to display.
    function RGBToHex(r, g, b) {
      r = Number(r).toString(16);
      g = Number(g).toString(16);
      b = Number(b).toString(16);

      if (r.length == 1) r = "0" + r;
      if (g.length == 1) g = "0" + g;
      if (b.length == 1) b = "0" + b;

      return "#" + r + g + b;
    }

    // Gradients aren't supported in variables yet.
    function gradientToCSS(nodeFill) {
      const nodeFillType = nodeFill.type;
      let cssGradient = "";

      if (nodeFillType === "GRADIENT_LINEAR") {
        const stops = nodeFill.gradientStops
          .map(stop => {
            const color = `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(
              stop.color.g * 255
            )}, ${Math.round(stop.color.b * 255)}, ${stop.color.a})`;
            return `${color} ${Math.round(stop.position * 100)}%`;
          })
          .join(", ");
        cssGradient = `linear-gradient(${stops})`;
      } else if (
        nodeFillType === "GRADIENT_RADIAL" ||
        nodeFillType === "GRADIENT_DIAMOND"
      ) {
        const stops = nodeFill.gradientStops
          .map(stop => {
            const color = `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(
              stop.color.g * 255
            )}, ${Math.round(stop.color.b * 255)}, ${stop.color.a})`;
            return `${color} ${Math.round(stop.position * 100)}%`;
          })
          .join(", ");
        cssGradient = `radial-gradient(${stops})`;
      } else if (nodeFillType === "GRADIENT_ANGULAR") {
        const stops = nodeFill.gradientStops
          .map(stop => {
            const color = `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(
              stop.color.g * 255
            )}, ${Math.round(stop.color.b * 255)}, ${stop.color.a})`;
            return `${color} ${Math.round(stop.position * 100)}%`;
          })
          .join(", ");
        cssGradient = `conic-gradient(${stops})`;
      }

      return cssGradient;
    }

    async function findVariables() {
      const currentPage = figma.currentPage;

      const nodes = currentPage
        .findAllWithCriteria({
          types: [
            "TEXT",
            "BOOLEAN_OPERATION",
            "FRAME",
            "COMPONENT",
            "COMPONENT_SET",
            "GROUP",
            "SECTION",
            "STAR",
            "RECTANGLE",
            "POLYGON",
            "ELLIPSE",
            "INSTANCE",
            "VECTOR",
            "LINE"
          ]
        })
        .filter(node => {
          return (
            node.boundVariables
          );
        });

      const isNotEmpty = (obj) => {
        return Object.keys(obj).length !== 0;
      };

      // Check each node for variables
      for (const node of nodes) {
        // Check to see if the node has any variables being used.
        if (isNotEmpty(node.boundVariables)) {
          // console.log(node.boundVariables);

          const boundVariables = node.boundVariables;

          // Loop through all the variables on this node.
          Object.keys(boundVariables).forEach(async (key) => {
            const variableObject = boundVariables[key];
            let variableId;
            let isFill = false;

            // Some boundVariable objects have slightly different syntax
            // depending on how they're used, so the variable id may deeper
            // in the object, so we check for that here.

            if (key === 'fills') {
              // Use the first fill since variables are only one fill in length.
              variableId = variableObject[0].id
              isFill = true;
            } else if (key === 'componentProperties') {
              // We may need a loop if components can have multiple properties
              variableId = variableObject["Has Items"].id;
            } else {
              // All other variable types
              variableId = variableObject.id
            }

            // Check if a variable already exists in the variablesInUse array
            const existingVariable = variablesInUse.variables.find(
              variable => variable.id === variableId
            );

            if (existingVariable) {
              // If the variable exists, update the count and consumers properties
              existingVariable.count += 1;
              existingVariable.consumers.push(node);
            } else {
              try {
                // If the variable does not exist, create a new variable object and push it to the variablesInUse fills array
                const variable = figma.variables.getVariableById(variableId);

                // console.log(variable);

                if (variable === null) {
                  return
                }

                const keys = Object.keys(variable.valuesByMode);
                const firstKey = keys[0];
                let typeLabel;

                if (variable.resolvedType === "FLOAT") {
                  typeLabel = "number";
                } else if (variable.resolvedType === "BOOLEAN") {
                  typeLabel = "boolean";
                } else if (variable.resolvedType === "STRING") {
                  typeLabel = "string";
                } else if (variable.resolvedType === "COLOR") {
                  typeLabel = "color";
                }

                if (isFill === true) {
                  if (typeof node.fills === "symbol") {
                    return
                  }
                  let currentFill = determineFill(node.fills);
                  let nodeFillType = node.fills[0].type;
                  let cssSyntax = null;

                  if (nodeFillType === "SOLID") {
                    cssSyntax = currentFill;
                  } else if (
                    nodeFillType !== "SOLID" &&
                    nodeFillType !== "VIDEO" &&
                    nodeFillType !== "IMAGE"
                  ) {
                    cssSyntax = gradientToCSS(node.fills[0]);
                  }

                  const capitalizedHexValue = currentFill.toUpperCase().replace('#', '');

                  variablesInUse.variables.push({
                    id: variableId,
                    resolvedType: variable.resolvedType,
                    type: typeLabel,
                    name: variable.name,
                    description: variable.description,
                    key: variable.key,
                    count: 1,
                    collectionId: variable.variableCollectionId,
                    valuesByMode: variable.valuesByMode,
                    consumers: [node],
                    value: capitalizedHexValue,
                    cssSyntax: cssSyntax,
                  });
                } else {
                  let formattedValue;

                  if (variable.valuesByMode[firstKey] === true) {
                    formattedValue = "True";
                  } else if (variable.valuesByMode[firstKey] === false) {
                    formattedValue = "False";
                  } else {
                    formattedValue = variable.valuesByMode[firstKey];
                  } 

                  if (typeof formattedValue === 'object' && !Array.isArray(formattedValue) && formattedValue !== null) {
                    if (formattedValue.type === "VARIABLE_ALIAS") {
                      let importedVariableAlias = figma.variables.getVariableById(formattedValue.id);
                      
                      variablesInUse.variables.push({
                        id: variableId,
                        resolvedType: variable.resolvedType,
                        type: typeLabel,
                        name: variable.name,
                        description: variable.description,
                        key: variable.key,
                        count: 1,
                        collectionId: variable.variableCollectionId,
                        valuesByMode: variable.valuesByMode,
                        consumers: [node],
                        value: '"' + importedVariableAlias.name + ' (alias)"',
                        cssSyntax: null,
                      });
                    }
                  } else {
                    variablesInUse.variables.push({
                      id: variableId,
                      resolvedType: variable.resolvedType,
                      type: typeLabel,
                      name: variable.name,
                      description: variable.description,
                      key: variable.key,
                      count: 1,
                      collectionId: variable.variableCollectionId,
                      valuesByMode: variable.valuesByMode,
                      consumers: [node],
                      value: formattedValue,
                      cssSyntax: null,
                    });
                  }
                }
              }
              catch (err) {
                return
              }
            }
          });
        }
      }
    }

    findVariables().then(() => {
      const groupConsumersByType = consumers => {
        const groupedConsumers = {};

        consumers.forEach(consumer => {
          let nodeType = consumer.type;
          let nodeId = consumer.id;

          if (!groupedConsumers[nodeType]) {
            groupedConsumers[nodeType] = [];
          }

          groupedConsumers[nodeType].push(nodeId);
        });

        return groupedConsumers;
      };

      // Function to apply groupConsumersByType to the global variable library
      const applyGroupingToLibrary = variablesLibrary => {
        return Object.fromEntries(
          Object.entries(variablesLibrary).map(([key, value]) => {
            // Check if the value is an array
            if (Array.isArray(value)) {
              // Apply the groupConsumersByType function to the variables
              const variablesWithGroupedConsumers = value.map(variable => {
                const groupedConsumers = groupConsumersByType(
                  variable.consumers
                );
                return { ...variable, groupedConsumers };
              });
              return [key, variablesWithGroupedConsumers];
            } else {
              // For non-array properties, copy the original value
              return [key, value];
            }
          })
        );
      };

      // Organize the array alphabtically
      variablesInUse.variables.sort((a, b) => a.name.localeCompare(b.name));

      const variablesWithGroupedConsumers = applyGroupingToLibrary(
        variablesInUse
      );

      // Let the UI know we're done and send the
      // variables back to be displayed.
      figma.ui.postMessage({
        type: "variables-imported",
        message: variablesWithGroupedConsumers
      });
    });
  
    // When the user clicks on a variable or one of the layer types
    // using the variable, we need to select those nodes.
  } else if (msg.type === "select-multiple-layers") {
    const layerArray = msg.nodeArray;
    let nodesToBeSelected = [];

    layerArray.forEach(item => {
      let layer = figma.getNodeById(item);
      // Using selection and viewport requires an array.
      nodesToBeSelected.push(layer);
    });

    // Moves the layer into focus and selects it.
    figma.currentPage.selection = nodesToBeSelected;
    figma.viewport.scrollAndZoomIntoView(nodesToBeSelected);

    // Let the user know what layers we selected and why.
    figma.notify(`${nodesToBeSelected.length} layers selected using ${msg.name}`, {
      timeout: 1500
    });
  }
};
