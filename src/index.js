import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Tabs, Radio, Divider, Empty, Skeleton } from "antd";
import {
  FileProtectOutlined,
  BankOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import "antd/dist/antd.css";
import {
  FORMAT_DATA,
  IMG,
  LICENSE_TYPE_ORDER,
  STATES,
  MAP_SELECTED_COLOR,
  MAP_INITIAL_COLOR,
} from "./helper";
import axios from "axios";
import { AustraliaMap } from "./australiaMap";
import ImageMapper from "react-image-mapper";
import "./style.css";
import { animations, AnimateOnChange } from "react-animation";

const { TabPane } = Tabs;

class App extends Component {
  state = {
    selectedState: "QLD",
    selectedClass: "",
    selectedClassDetail: "",
    data: "",
    isLoading: false,
    error: false,
    hoveredArea: AustraliaMap.areas[0],
  };

  componentDidMount() {
    const params = window.location.pathname.split("/").pop();
    this.setState({ isLoading: true });
    const formatData = FORMAT_DATA;
    const url = `https://spreadsheets.google.com/feeds/list/1zXYvLe9atHvY6aapaPPazQpskk8nbJieBUiA6fDD0L8/${LICENSE_TYPE_ORDER[params]}/public/values?alt=json`;
    axios
      .get(url)
      .then((response) => {
        const originalDataArray = response.data.feed.entry;
        originalDataArray.forEach((element) => {
          formatData[element.gsx$state.$t].availableClasses.push(
            element.gsx$class.$t
          );
          formatData[element.gsx$state.$t][element.gsx$class.$t] = {};
          formatData[element.gsx$state.$t][element.gsx$class.$t].scopeOfWork =
            element.gsx$scopeofwork.$t;
          formatData[element.gsx$state.$t][element.gsx$class.$t].expRequired =
            element.gsx$exprequired.$t;
          formatData[element.gsx$state.$t][element.gsx$class.$t].qualRequired =
            element.gsx$qualrequired.$t;
        });
        this.setState({ data: formatData, isLoading: false });
      })
      .catch((err) => {
        this.setState({ error: err.message, isLoading: false });
      });
  }

  renderStates = (states) => {
    return states.map((state) => (
      <TabPane tab={state} key={state}>
        {this.renderClassesByState(state)}
      </TabPane>
    ));
  };

  renderClassesByState = (state) => {
    return (
      <div style={{ animation: animations.fadeIn }}>
        <Radio.Group
          onChange={this.radioOnChange}
          value={this.state.selectedClass}
        >
          {this.renderEachStateAllClasses(state)}
        </Radio.Group>
      </div>
    );
  };

  radioOnChange = (e) => {
    this.setState(
      {
        selectedClass: e.target.value,
      },
      () => {
        this.setState({
          selectedClassDetail: this.state.data
            ? this.state.data[this.state.selectedState][
                this.state.selectedClass
              ]
            : "",
        });
      }
    );
  };

  renderEachStateAllClasses = (state) => {
    const radioStyle = {
      display: "block",
      height: "30px",
      lineHeight: "30px",
    };
    if (this.state.data) {
      if (
        this.state.data[state] &&
        this.state.data[state].availableClasses &&
        this.state.data[state].availableClasses.length > 0
      ) {
        return this.state.data[state].availableClasses.map((singleClass) => {
          return (
            <Radio key={singleClass} style={radioStyle} value={singleClass}>
              {singleClass}
            </Radio>
          );
        });
      } else {
        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
      }
    } else {
      return null;
    }
  };

  getTipPosition(area) {
    const n = area.coords.length / 2;
    const { y, x } = area.coords.reduce(
      ({ y, x }, val, idx) => {
        return !(idx % 2) ? { y, x: x + val / n } : { y: y + val / n, x };
      },
      { y: 0, x: 0 }
    );
    return {
      top: `${y}px`,
      left: `${x}px`,
    };
  }

  mapStateChange = (e) => {
    const targetArea = AustraliaMap.areas.filter(
      (area) => area.name === e.name
    )[0];
    this.setState({
      selectedState: e.name,
      selectedClass: "",
      selectedClassDetail: "",
      hoveredArea: targetArea,
    });
  };

  tabStateChange = (value) => {
    const targetArea = AustraliaMap.areas.filter(
      (area) => area.name === value
    )[0];
    this.setState({
      selectedState: value,
      selectedClass: "",
      selectedClassDetail: "",
      hoveredArea: targetArea,
    });
  };

  enterArea = (area) => {
    this.setState({
      hoveredArea: area,
    });
  };

  leaveArea = () => {
    this.setState({
      hoveredArea: null,
    });
  };

  handleAustraliaMap = (AustraliaMap) => {
    AustraliaMap.areas = AustraliaMap.areas.map((area) => {
      if (area.name === this.state.selectedState) {
        area.preFillColor = MAP_SELECTED_COLOR;
        return area;
      } else {
        area.preFillColor = MAP_INITIAL_COLOR;
        return area;
      }
    });
    return AustraliaMap;
  };

  render() {
    const handledAustraliaMap = this.handleAustraliaMap(AustraliaMap);
    return this.state.isLoading ? (
      <div className="map-card-container width-change">
        <Skeleton active />
      </div>
    ) : this.state.error ? (
      <div className="map-card-container width-change">
        <AnimateOnChange animationIn="fadeIn" animationOut="fadeOut">
          <div>{this.state.error}</div>
        </AnimateOnChange>
      </div>
    ) : (
      <div className="map-card-class-detail-container">
        <div className="map-card-container">
          <div className="map-container">
            <ImageMapper
              src={IMG}
              map={handledAustraliaMap}
              width={300}
              onClick={(e) => this.mapStateChange(e)}
              onMouseEnter={(area) => this.enterArea(area)}
              onMouseLeave={(area) => this.leaveArea(area)}
            />
            {this.state.hoveredArea && (
              <span
                className="tooltip"
                style={{ ...this.getTipPosition(this.state.hoveredArea) }}
              >
                {this.state.hoveredArea && this.state.hoveredArea.name}
              </span>
            )}
          </div>
          <div className="card-container">
            <h4>Click On The Map</h4>
            <h5>Select A State Then A Class Type</h5>
            <Tabs
              key={this.state.selectedState}
              type="card"
              defaultActiveKey={this.state.selectedState}
              onChange={(value) => this.tabStateChange(value)}
            >
              {this.renderStates(STATES)}
            </Tabs>
          </div>
        </div>
        <div className="class-detail-container">
          <div className="divider-container">
            <Divider>
              <GlobalOutlined className="divider-icon" />
              <span className="divider-text">Scope Of Work</span>
            </Divider>
          </div>
          <div className="single-class-detail-container">
            {this.state.selectedClassDetail ? (
              <AnimateOnChange animationIn="fadeIn" animationOut="fadeOut">
                <p>{this.state.selectedClassDetail.scopeOfWork}</p>
              </AnimateOnChange>
            ) : (
              <AnimateOnChange animationIn="fadeIn" animationOut="fadeOut">
                <p>No Selection</p>
              </AnimateOnChange>
            )}
          </div>
          <div className="divider-container">
            <Divider>
              <BankOutlined className="divider-icon" />
              <span className="divider-text">Experience Required</span>
            </Divider>
          </div>
          <div className="single-class-detail-container">
            {this.state.selectedClassDetail ? (
              <AnimateOnChange animationIn="fadeIn" animationOut="fadeOut">
                <p>{this.state.selectedClassDetail.expRequired}</p>
              </AnimateOnChange>
            ) : (
              <AnimateOnChange animationIn="fadeIn" animationOut="fadeOut">
                <p>No Selection</p>
              </AnimateOnChange>
            )}
          </div>
          <div className="divider-container">
            <Divider>
              <FileProtectOutlined className="divider-icon" />
              <span className="divider-text">Quality Required</span>
            </Divider>
          </div>
          <div className="single-class-detail-container">
            {this.state.selectedClassDetail ? (
              <AnimateOnChange animationIn="fadeIn" animationOut="fadeOut">
                <p>{this.state.selectedClassDetail.qualRequired}</p>
              </AnimateOnChange>
            ) : (
              <AnimateOnChange animationIn="fadeIn" animationOut="fadeOut">
                <p>No Selection</p>
              </AnimateOnChange>
            )}
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  React.createElement(App, {}, null),
  document.getElementById("react-target")
);
