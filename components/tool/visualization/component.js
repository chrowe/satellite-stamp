import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import classnames from 'classnames';

import { getViewportFromBounds, Legend } from 'components/map';
import Map from './map';
import Attributions from '../attributions';

import './style.scss';

const Visualization = ({
  exporting,
  width,
  height,
  mapsActiveLayersDef,
  mapsTitle,
  legendDataLayers,
  viewports,
  mode,
  modeParams,
  updateLayer,
  removeLayer,
  updateLayerOrder,
  updateViewport,
  updateViewports,
}) => {
  /**
   * @type {(mapIndex: any, mapViewport: any) => void}
   */
  const onChangeViewport = useCallback(
    debounce((index, difference, mapViewport) => {
      const viewport = {
        zoom: mapViewport.zoom,
        latitude: mapViewport.latitude,
        longitude: mapViewport.longitude,
        bounds: mapViewport.bounds,
      };

      // If the user is using a temporal difference, all the maps should have the same position
      if (difference === 'temporal' && index === 0) {
        updateViewports(viewport);
      } else {
        updateViewport({
          index,
          viewport,
        });
      }
    }, 500),
    [updateViewport]
  );

  return (
    <div className={classnames(['c-tool-visualization', `mode-${mode}`])}>
      {exporting && <div className="exporting-message">Exporting...</div>}
      <div
        className="container-width js-visualization"
        // We need both width and min-width:
        // - width so that maps smaller than the parent are correctly sized
        // - min-width so that maps bigger than the parent overflow correctly
        style={exporting ? { width: `${width}px`, minWidth: `${width}px` } : undefined}
      >
        <div className="container-ratio" style={exporting ? { height: `${height}px` } : undefined}>
          <Legend
            exporting={exporting}
            layers={legendDataLayers}
            onChangeOpacity={(id, opacity) => updateLayer({ id, opacity })}
            onClickToggleVisibility={(id, visible) => updateLayer({ id, visible })}
            onClickRemove={removeLayer}
            onChangeDate={(id, dates) =>
              updateLayer({ id, dateRange: [dates[0], dates[2]], currentDate: dates[1] })
            }
            onChangeLayersOrder={updateLayerOrder}
          />
          <div
            className="map-container"
            style={
              exporting
                ? {
                    width,
                    height: height - 26, // 26px is the height of the attributions
                  }
                : undefined
            }
          >
            {viewports.map((viewport, index) => (
              <div key={index} className="map">
                {mapsTitle[index] && <div className="title">{mapsTitle[index]}</div>}
                <Map
                  layers={mapsActiveLayersDef[index]}
                  viewport={viewports[index]}
                  onChangeViewport={
                    // We remove the callback to indicate the map should be static
                    index === 0 || modeParams.difference === 'spatial'
                      ? v => onChangeViewport(index, modeParams.difference, v)
                      : undefined
                  }
                  onResize={({ width, height }) => {
                    if (viewports[index].bounds) {
                      updateViewport({
                        index,
                        viewport: getViewportFromBounds(
                          width,
                          height,
                          viewports[index],
                          viewports[index].bounds
                        ),
                      });
                    }
                  }}
                />
              </div>
            ))}
          </div>
          <Attributions />
        </div>
      </div>
    </div>
  );
};

Visualization.propTypes = {
  viewports: PropTypes.arrayOf(PropTypes.object).isRequired,
  mapsActiveLayersDef: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
  mapsTitle: PropTypes.arrayOf(PropTypes.string).isRequired,
  legendDataLayers: PropTypes.arrayOf(PropTypes.object).isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  exporting: PropTypes.bool.isRequired,
  mode: PropTypes.string.isRequired,
  modeParams: PropTypes.object.isRequired,
  updateViewport: PropTypes.func.isRequired,
  updateViewports: PropTypes.func.isRequired,
  updateBasemap: PropTypes.func.isRequired,
  removeLayer: PropTypes.func.isRequired,
  updateLayer: PropTypes.func.isRequired,
  updateLayerOrder: PropTypes.func.isRequired,
};

export default Visualization;