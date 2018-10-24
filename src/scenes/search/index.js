import React from "react";
import { Route } from "react-router-dom";
import { connect } from "react-redux";
import { push } from "react-router-redux";
import {
  Row,
  Col,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Container,
  Badge
} from "reactstrap";
import queryString from "query-string";
import {
  ReactiveBase,
  DataSearch,
  SelectedFilters,
  ReactiveComponent
} from "@appbaseio/reactivesearch";
import classnames from "classnames";

import List from "./subComponents/List";
import Map from "./subComponents/Map";
import Mosaique from "./subComponents/Mosaique";

import MultiList from "./multiList";

import { es_url } from "../../config.js";
import { isDepartmentNumber, departmentText } from "./department";

import filterImg from "../../assets/filter.png";

import "./index.css";

const FILTER = [
  "mainSearch",
  "domn",
  "deno",
  "periode",
  "image",
  "tech",
  "region",
  "departement",
  "commune",
  "base",
  "geolocalisation",
  "auteur",
  "ou"
];

class Search extends React.Component {
  state = {
    activeTab: "list",
    bases: ["merimee", "palissy", "memoire", "joconde", "mnr"].join(","),
    defaultSelected: "",
    mobile_menu: "mobile_close"
  };

  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
  }

  componentDidMount() {
    const { location } = this.props;
    const values = queryString.parse(location.search);
    const { bases, mainSearch } = values;
    const mainSearchSelected = () => {
      try {
        return JSON.parse(mainSearch);
      } catch (e) {
        return "";
      }
    };

    let activeTab = "list";
    if (/search\/map/.test(location.pathname)) {
      activeTab = "map";
    } else if (/search\/mosaique/.test(location.pathname)) {
      activeTab = "mosaique";
    }

    this.setState({
      activeTab,
      bases:
        bases || ["merimee", "palissy", "memoire", "joconde", "mnr"].join(","),
      defaultSelected: mainSearchSelected()
    });
  }

  componentDidUpdate(prevProps) {
    const { location } = this.props;
    const { location: prevLocation } = prevProps;

    if (location.pathname !== prevLocation.pathname) {
      let activeTab = "list";
      if (/search\/map/.test(location.pathname)) {
        activeTab = "map";
      } else if (/search\/mosaique/.test(location.pathname)) {
        activeTab = "mosaique";
      }
      this.setState({ activeTab });
    }
  }

  toggle(subRoute) {
    const { onTabClicked, location } = this.props;
    if (this.state.activeTab !== subRoute) {
      onTabClicked(subRoute, location.search);
    }
  }

  onMapChanged(info) {
    console.log(info);
  }

  render() {
    const { bases } = this.state;
    return (
      <div className="search">
        <Container fluid style={{ maxWidth: 1860 }}>
          <h2 className="title">Votre recherche</h2>
          <ReactiveBase url={`${es_url}`} app={bases}>
            <Row>
              <div className={`search-filters ${this.state.mobile_menu}`}>
                <aside className="search-sidebar">
                  <div
                    className="close_mobile_menu"
                    onClick={() =>
                      this.setState({ mobile_menu: "mobile_close" })
                    }
                  >
                    x
                  </div>
                  <SelectedFilters
                    className="selected-filters"
                    clearAllLabel="Tout supprimer"
                  />
                  <h4>Affiner par</h4>
                  <MultiList
                    dataField="BASE.keyword"
                    title="Base"
                    componentId="base"
                    showSearch={false}
                    react={{ and: ["deno", "domn"] }}
                  />
                  <MultiList
                    dataField={["AUTP.keyword", "AUTR.keyword"]}
                    title="Auteur"
                    componentId="auteur"
                    placeholder="Rechercher un auteur"
                  />
                  <MultiList
                    dataField="DOMN.keyword"
                    title="Domaine"
                    placeholder="Rechercher un domaine"
                    componentId="domn"
                    react={{ and: ["base", "deno"] }}
                  />
                  <MultiList
                    dataField={["REG.keyword", "COM.keyword", "LOCA.keyword"]}
                    title="Où voir l'oeuvre?"
                    placeholder="Commune, musée"
                    componentId="ou"
                    react={{ and: ["base"] }}
                  />
                  {/* <MultiList
                    dataField="DENO.keyword"
                    title="Dénomination"
                    placeholder="Rechercher une dénomination"
                    componentId="deno"
                    react={{ and: ["base","domn"] }}
                  /> */}

                  {/* <MultiList
                    dataField="REG.keyword"
                    title="Région"
                    componentId="region"
                    placeholder="Rechercher une région"
                    react={{ and: ["departement","commune"] }}
                    sortByName
                  />
                  <MultiList
                    dataField="DPT.keyword"
                    title="Département"
                    componentId="departement"
                    placeholder="Rechercher un département"
                    sortByName
                    showSearch={false}
                    limit={200}
                    react={{ and: ["region","commune"] }}
                    filterListItem={bucket => isDepartmentNumber(bucket.key)}
                    renderListItem={(label, count) => {
                      return (
                        <div>
                          {departmentText(label)} ({count})
                        </div>
                      );
                    }}
                  /> */}
                  {/* <MultiList
                    dataField="COM.keyword"
                    title="Commune"
                    componentId="commune"
                    react={{ and: ["region", "departement"] }}
                  /> */}
                  <MultiList
                    dataField="PERI.keyword"
                    title="Période"
                    componentId="periode"
                    placeholder="Rechercher une période"
                  />

                  <MultiList
                    dataField="CONTIENT_IMAGE.keyword"
                    title="Contient une image"
                    componentId="image"
                    placeholder="oui ou non"
                    showSearch={false}
                    defaultSelected={
                      this.state.activeTab === "mosaique" ? ["oui"] : []
                    }
                  />
                  <MultiList
                    componentId="geolocalisation"
                    dataField="POP_CONTIENT_GEOLOCALISATION.keyword"
                    title="Est géolocalisé"
                    filterLabel="Est géolocalisé "
                    queryFormat="or"
                    className="filters"
                    showSearch={false}
                    URLParams={true}
                    showSearch={false}
                    defaultSelected={
                      this.state.activeTab === "map" ? ["oui"] : []
                    } // TODO clean this
                    data={[
                      { label: "oui", value: "oui" },
                      { label: "non", value: "non" }
                    ]}
                    react={{
                      and: FILTER
                    }}
                  />
                  <MultiList
                    dataField="TECH.keyword"
                    title="Techniques"
                    componentId="tech"
                    placeholder="Rechercher une technique"
                  />
                </aside>
              </div>
              <div className="search-results">
                <Row className="search-row">
                  <Col sm={8}>
                    <div className="search-and-export-zone">
                      <DataSearch
                        componentId="mainSearch"
                        filterLabel="Résultats pour "
                        dataField={[
                          "TICO",
                          "TITR",
                          "AUTP",
                          "DENO",
                          "AUTR",
                          "AUTOR"
                        ]}
                        defaultSelected={this.state.defaultSelected}
                        iconPosition="left"
                        className="mainSearch"
                        placeholder="Saisissez un titre, une dénomination ou une localisation"
                        URLParams={true}
                        customQuery={(value, props) => {
                          if (!value) {
                            return {
                              query: { match_all: {} }
                            };
                          }
                          return {
                            bool: {
                              should: [
                                {
                                  multi_match: {
                                    query: value,
                                    type: "phrase",
                                    fields: ["TICO", "TITRE", "TITR"],
                                    boost: 15
                                  }
                                },
                                {
                                  multi_match: {
                                    query: value,
                                    type: "most_fields",
                                    fields: [
                                      "TICO^10",
                                      "TITRE^9",
                                      "TITR^9",
                                      "AUTI^8",
                                      "DENO^5",
                                      "REPR^5",
                                      "PDEN^5",
                                      "AUTR^4",
                                      "AUTP^4",
                                      "PERS^4",
                                      "LOCA^7",
                                      "PAYS^3",
                                      "REG^3",
                                      "DEP^3",
                                      "COM^3",
                                      "DATE^1",
                                      "EPOQ^1",
                                      "SCLE^1",
                                      "SCLD^1"
                                    ]
                                  }
                                }
                              ]
                            }
                          };
                        }}
                      />
                      <div
                        className="filter_mobile_menu"
                        onClick={() =>
                          this.setState({ mobile_menu: "mobile_open" })
                        }
                      >
                        <SelectedFilters
                          render={props => {
                            return (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center"
                                }}
                              >
                                <img src={filterImg} />
                                <Badge color="secondary">
                                  {Object.keys(props.selectedValues).reduce(
                                    (acc, current) => {
                                      return props.selectedValues[current]
                                        .value !== ""
                                        ? acc + 1
                                        : acc;
                                    },
                                    0
                                  )}
                                </Badge>
                              </div>
                            );
                          }}
                        />
                      </div>
                    </div>
                  </Col>
                  <Col sm={4}>
                    <Nav pills>
                      <NavItem>
                        <NavLink
                          className={classnames({
                            active: this.state.activeTab === "list"
                          })}
                          onClick={() => {
                            this.toggle("list");
                          }}
                        >
                          LISTE
                        </NavLink>
                      </NavItem>

                      <NavItem>
                        <NavLink
                          className={classnames({
                            active: this.state.activeTab === "map"
                          })}
                          onClick={() => {
                            this.toggle("map");
                          }}
                        >
                          CARTE
                        </NavLink>
                      </NavItem>

                      <NavItem>
                        <NavLink
                          className={classnames({
                            active: this.state.activeTab === "mosaique"
                          })}
                          onClick={() => {
                            this.toggle("mosaique");
                          }}
                        >
                          MOSAIQUE
                        </NavLink>
                      </NavItem>
                    </Nav>
                  </Col>
                </Row>
                <TabContent activeTab={this.state.activeTab}>
                  <TabPane tabId="list">
                    <Route
                      exact
                      path="/search/list"
                      render={() => <List filter={FILTER} />}
                    />
                  </TabPane>
                  <TabPane tabId="map">
                    <Route
                      exact
                      path="/search/map"
                      render={() => <Map filter={FILTER} />}
                    />
                  </TabPane>
                  <TabPane tabId="mosaique">
                    <Route
                      exact
                      path="/search/mosaique"
                      render={() => <Mosaique filter={FILTER} />}
                    />
                  </TabPane>
                </TabContent>
              </div>
            </Row>
          </ReactiveBase>
        </Container>
      </div>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = dispatch => ({
  onTabClicked: (subPath, params) => {
    dispatch(push(`/search/${subPath}${params}`));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Search);
