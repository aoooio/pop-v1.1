import React from "react";
import { ReactiveComponent } from "@appbaseio/reactivesearch";
import "./mapbox-gl.css";

export default class Umbrella extends React.Component {
  state = {};
  componentWillMount() {
    this.updateQuery(51, -5, 41, -6, 3);
  }

  updateQuery(
    top_left_lat,
    top_left_lon,
    bottom_right_lat,
    bottom_right_lon,
    precision
  ) {
    const query = `{
      "size": 1,
      "query": {
        "constant_score": {
          "filter": {
            "geo_bounding_box": {
              "POP_COORDONNEES": {
                "top_left": {
                  "lat": "${top_left_lat}",
                  "lon": "${top_left_lon}"
                },
                "bottom_right": {
                  "lat": "${bottom_right_lat}",
                  "lon": "${bottom_right_lon}"
                }
              }
            }
          }
        }
      },
      "aggs": {
        "france": {
          "geohash_grid": {
            "field": "POP_COORDONNEES",
            "precision": ${precision}
          }
        }
      }
    }`;
    this.setState({ query: JSON.parse(query) });
  }

  render() {
    return (
      <ReactiveComponent
        componentId={this.props.componentId || "map"} // a unique id we will refer to later
        URLParams={this.props.URLParams || true}
        react={this.props.react || {}}
        defaultQuery={() => this.state.query}
      >
        <Map />
      </ReactiveComponent>
    );
  }
}

class Map extends React.Component {
  state = {
    loaded: false
  };
  componentDidMount() {
    const center = [2.367101341254551, 48.86162755885409];
    mapboxgl.accessToken =
      "pk.eyJ1IjoiZ29mZmxlIiwiYSI6ImNpanBvcXNkMTAwODN2cGx4d2UydzM4bGYifQ.ep25-zsrkOpdm6W1CsQMOQ";

    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: "mapbox://styles/mapbox/light-v9",
      center,
      zoom: 13
    });
    const map = this.map;
    map.on("load", () => {
      map.addSource("pop", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: []
        }
      });
      this.setState({ loaded: true });
    });
  }

  componentWillUnmount() {
    this.map.remove();
  }

  renderClusters() {
    if (this.state.loaded && this.props.aggregations) {
      const geojson = toGeoJson(this.props.aggregations.france.buckets);
      console.log("add", geojson);
      this.map.getSource("pop").setData(geojson);
    }
  }

  render() {
    const style = {
      width: "100%",
      height: "1000px"
    };
    return (
      <div style={style} ref={el => (this.mapContainer = el)}>
        {this.renderClusters()}
      </div>
    );
  }
}

function toGeoJson(arr) {
  const geoJsonFormated = {
    type: "FeatureCollection",
    crs: { type: "name", properties: { name: "POP" } },
    features: []
  };

  for (var i = 0; i < arr.length; i++) {
    const item = arr[i];
    geoJsonFormated.features.push({
      type: "Feature",
      properties: {
        id: item.key,
        count: item.doc_count
      },
      geometry: {
        type: "Point",
        coordinates: [1.092157, 47.551314]
      }
    });
  }

  return geoJsonFormated;
}
