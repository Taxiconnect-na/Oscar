import React, { useEffect, useState } from "react";
import queryString from "query-string";
import Sidebar from "../sidebar/sidebar";
import "./driverRegistration.css";
import { AiOutlineCheckSquare } from "react-icons/ai";
import { VscError } from "react-icons/vsc";

const getBase64 = (file) => {
  return new Promise((resolve) => {
    let fileInfo;
    let baseURL = "";
    // Make new FileReader
    let reader = new FileReader();

    // Convert the file to base64 text
    reader.readAsDataURL(file);

    // on reader load somthing...
    reader.onload = () => {
      // Make a fileInfo Object
      baseURL = reader.result;
      resolve(baseURL);
    };
  });
};

export default function DriverDataUpdate({ location }) {
  // Images source:

  let [car_image, setCarImage] = useState("");
  // Driver's details
  let [driverFingerPrint, setDriverFingerprint] = useState("");
  let [taxi_number, setTaxiNumber] = useState("M1414");
  let [name, setName] = useState("Mack");
  let [surname, setSurname] = useState("Makengo");
  let [plate_number, setPlateNumber] = useState("K1414M");
  let [phone_number, setPhoneNumber] = useState("contact");

  // car files:
  let [taxi_picture, setTaxiPicture] = useState("");
  let [taxi_picture_name, setTaxiPictureName] = useState("Taxi picture");

  let [profile_picture, setProfilePicture] = useState("");
  let [profile_picture_name, setProfilePictureName] =
    useState("Profile Picture");

  let [driver_licence_doc, setDriverLicenceDoc] = useState("");
  let [driver_licence_doc_name, setDriverLicenceDocName] =
    useState("Driver's licence");

  let [copy_id_paper, setCopyIdPaper] = useState("");
  let [copy_id_paper_name, setCopyIdPaperName] = useState("Personal ID");

  let [copy_white_paper, setCopyWhitepaper] = useState("");
  let [copy_white_paper_name, setCopyWhitepaperName] = useState("White paper");

  let [copy_public_permit, setCopyPublicPermit] = useState("");
  let [copy_public_permit_name, setCopyPublicPermitName] =
    useState("Public permit");

  let [copy_blue_paper, setCopyBluePaper] = useState("");
  let [copy_blue_paper_name, setCopyBluePaperName] = useState("Blue paper");

  //Upload tracking variables (Taxi picture)
  let [success, setSuccess] = useState(false);
  let [failure, setFailure] = useState(false);
  let [uploading, setUploading] = useState(false);

  //Upload tracking variables (Profile picture)
  let [success_profile, setSuccessProfile] = useState(false);
  let [failure_profile, setFailureProfile] = useState(false);
  let [uploading_profile, setUploadingProfile] = useState(false);

  //Upload tracking variables (Driver Licence)
  let [success_licence, setSuccessLicence] = useState(false);
  let [failure_licence, setFailureLicence] = useState(false);
  let [uploading_licence, setUploadingLicence] = useState(false);

  //Upload tracking variables (id paper)
  let [success_id, setSuccessID] = useState(false);
  let [failure_id, setFailureID] = useState(false);
  let [uploading_id, setUploadingID] = useState(false);

  //Upload tracking variables (White paper)
  let [success_white, setSuccessWhite] = useState(false);
  let [failure_white, setFailureWhite] = useState(false);
  let [uploading_white, setUploadingWhite] = useState(false);

  //Upload tracking variables (Public Permit)
  let [success_permit, setSuccessPermit] = useState(false);
  let [failure_permit, setFailurePermit] = useState(false);
  let [uploading_permit, setUploadingPermit] = useState(false);

  //Upload tracking variables (Blue Paper)
  let [success_blue, setSuccessBlue] = useState(false);
  let [failure_blue, setFailureBlue] = useState(false);
  let [uploading_blue, setUploadingBlue] = useState(false);

  let [success_info, setSuccessInfo] = useState(false);
  let [failure_info, setFailureInfo] = useState(false);
  let [uploadinginfo, setUploadingInfo] = useState(false);

  //Form state disable -> true/false
  let [info_form_state, setInfoFormState] = useState(true);

  //Other actions state variables
  let [suspension_loading, setSuspensionLoading] = useState(false);
  let [suspension_success, setSuspensionSuccess] = useState(false);
  let [suspension_failure, setSuspensionFailure] = useState(false);

  useEffect(() => {
    const {
      driverID,
      taxi,
      dname,
      dsurname,
      dplate_number,
      contact,
      taxipicture,
    } = queryString.parse(location.search);

    setDriverFingerprint(driverID);
    setTaxiNumber(taxi);
    setName(dname);
    setSurname(dsurname);
    setPlateNumber(dplate_number);
    setPhoneNumber(contact);
    setCarImage(taxipicture);
  }, [location.search]);

  /**
   * *DRIVER INFO UPDATE (FILES EXCLUDED)
   */

  const onSubmitDriverInfo = async (e) => {
    e.preventDefault();

    setUploadingInfo(true);

    //document to be updated
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        driverFingerPrint: queryString.parse(location.search).driverID,
        old_taxi_number: queryString.parse(location.search).taxi,
        name: name,
        surname: surname,
        phone_number: phone_number,
        taxi_number: taxi_number,
        plate_number: plate_number,
      }),
    };

    try {
      const data = await fetch(
        `${process.env.REACT_APP_GATEWAY}/update-driver-info`,
        options
      );
      const res = await data.json();

      if (res.success) {
        setSuccessInfo(true);
        setUploadingInfo(false);
      } else if (res.failure) {
        setFailureInfo(true);
        setUploadingInfo(false);
      }
    } catch (error) {
      setFailureInfo(true);
      setUploadingInfo(false);
      console.log(error);
    }
  };

  //Taxi picture handler
  const onSubmitTaxiPicture = (e) => {
    e.preventDefault();

    setUploading(true);

    getBase64(taxi_picture).then((result) => {
      try {
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            taxi_picture: result.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)[2],
            taxi_picture_name: taxi_picture_name,
            driverFingerPrint: queryString.parse(location.search).driverID,
            taxi_number: queryString.parse(location.search).taxi,
          }),
        };

        fetch(`${process.env.REACT_APP_GATEWAY}/file`, options)
          .then((response) => response.json())
          .then((res) => {
            if (res.success) {
              setSuccess(true);
              setUploading(false);
            } else if (res.failure) {
              setFailure(true);
              setUploading(false);
            }
          })
          .catch((error) => {
            console.error(error);
            console.log(" Some errors occured @ client ");
            setFailure(true);
            setUploading(false);
          });
      } catch (err) {
        console.log(err);
        console.log("There was a problem with the server");
        setFailure(true);
        setUploading(false);
      }
    });
  };

  //Profile picture handler
  const onSubmitProfilePicture = (e) => {
    e.preventDefault();

    setUploadingProfile(true);

    getBase64(profile_picture).then((result) => {
      try {
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profile_picture: result.match(
              /^data:([A-Za-z-+\/]+);base64,(.+)$/
            )[2],
            profile_picture_name: profile_picture_name,
            driverFingerPrint: queryString.parse(location.search).driverID,
          }),
        };

        fetch(`${process.env.REACT_APP_GATEWAY}/profile-picture`, options)
          .then((response) => response.json())
          .then((res) => {
            if (res.success) {
              setSuccessProfile(true);
              setUploadingProfile(false);
            } else if (res.failure) {
              setFailureProfile(true);
              setUploadingProfile(false);
            }
          })
          .catch((error) => {
            console.error(error);
            console.log(" Some errors occured @ client ");
            setFailureProfile(true);
            setUploadingProfile(false);
          });
      } catch (err) {
        console.log(err);
        console.log("There was a problem with the server");
        setFailureProfile(true);
        setUploadingProfile(false);
      }
    });
  };

  //Driver Licence
  const onSubmitDriverLicence = (e) => {
    e.preventDefault();

    setUploadingLicence(true);

    getBase64(driver_licence_doc).then((result) => {
      try {
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            driver_licence: result.match(
              /^data:([A-Za-z-+\/]+);base64,(.+)$/
            )[2],
            driver_licence_doc_name: driver_licence_doc_name,
            driverFingerPrint: queryString.parse(location.search).driverID,
          }),
        };

        fetch(`${process.env.REACT_APP_GATEWAY}/driver-licence`, options)
          .then((response) => response.json())
          .then((res) => {
            if (res.success) {
              setSuccessLicence(true);
              setUploadingLicence(false);
            } else if (res.failure) {
              setFailureLicence(true);
              setUploadingLicence(false);
            }
          })
          .catch((error) => {
            console.error(error);
            console.log(" Some errors occured @ client ");
            setFailureLicence(true);
            setUploadingLicence(false);
          });
      } catch (err) {
        console.log(err);
        console.log("There was a problem with the server");
        setFailureLicence(true);
        setUploadingLicence(false);
      }
    });
  };

  //Driver Id paper
  const onSubmitIdPaper = (e) => {
    e.preventDefault();

    setUploadingID(true);

    getBase64(copy_id_paper).then((result) => {
      try {
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            copy_id_paper: result.match(
              /^data:([A-Za-z-+\/]+);base64,(.+)$/
            )[2],
            copy_id_paper_name: copy_id_paper_name,
            driverFingerPrint: queryString.parse(location.search).driverID,
          }),
        };

        fetch(`${process.env.REACT_APP_GATEWAY}/id-paper`, options)
          .then((response) => response.json())
          .then((res) => {
            console.log(res);
            if (res.success) {
              setSuccessID(true);
              setUploadingID(false);
            } else if (res.failure) {
              setFailureID(true);
              setUploadingID(false);
            }
          })
          .catch((error) => {
            console.error(error);
            console.log(" Some errors occured @ client ");
            setFailureID(true);
            setUploadingID(false);
          });
      } catch (err) {
        console.log(err);
        console.log("There was a problem with the server");
        setFailureID(true);
        setUploadingID(false);
      }
    });
  };

  //White paper
  const onSubmitWhitePaper = (e) => {
    e.preventDefault();

    setUploadingWhite(true);

    getBase64(copy_white_paper).then((result) => {
      try {
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            copy_white_paper: result.match(
              /^data:([A-Za-z-+\/]+);base64,(.+)$/
            )[2],
            copy_white_paper_name: copy_white_paper_name,
            driverFingerPrint: queryString.parse(location.search).driverID,
          }),
        };

        fetch(`${process.env.REACT_APP_GATEWAY}/white-paper`, options)
          .then((response) => response.json())
          .then((res) => {
            console.log(res);
            if (res.success) {
              setSuccessWhite(true);
              setUploadingWhite(false);
            } else if (res.failure) {
              setFailureWhite(true);
              setUploadingWhite(false);
            }
          })
          .catch((error) => {
            console.error(error);
            console.log(" Some errors occured @ client ");
            setFailureWhite(true);
            setUploadingWhite(false);
          });
      } catch (err) {
        console.log(err);
        console.log("There was a problem with the server");
        setFailureWhite(true);
        setUploadingWhite(false);
      }
    });
  };

  //Public permit
  const onSubmitPublicPermit = (e) => {
    e.preventDefault();

    setUploadingPermit(true);

    getBase64(copy_public_permit).then((result) => {
      try {
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            copy_public_permit: result.match(
              /^data:([A-Za-z-+\/]+);base64,(.+)$/
            )[2],
            copy_public_permit_name: copy_public_permit_name,
            driverFingerPrint: queryString.parse(location.search).driverID,
          }),
        };

        fetch(`${process.env.REACT_APP_GATEWAY}/public-permit`, options)
          .then((response) => response.json())
          .then((res) => {
            console.log(res);
            if (res.success) {
              setSuccessPermit(true);
              setUploadingPermit(false);
            } else if (res.failure) {
              setFailurePermit(true);
              setUploadingPermit(false);
            }
          })
          .catch((error) => {
            console.error(error);
            console.log(" Some errors occured @ client ");
            setFailurePermit(true);
            setUploadingPermit(false);
          });
      } catch (err) {
        console.log(err);
        console.log("There was a problem with the server");
        setFailurePermit(true);
        setUploadingPermit(false);
      }
    });
  };

  //Blue Paper
  const onSubmitBluePaper = (e) => {
    e.preventDefault();

    setUploadingBlue(true);

    getBase64(copy_blue_paper).then((result) => {
      try {
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            copy_blue_paper: result.match(
              /^data:([A-Za-z-+\/]+);base64,(.+)$/
            )[2],
            copy_blue_paper_name: copy_blue_paper_name,
            driverFingerPrint: queryString.parse(location.search).driverID,
          }),
        };

        fetch(`${process.env.REACT_APP_GATEWAY}/blue-paper`, options)
          .then((response) => response.json())
          .then((res) => {
            console.log(res);
            if (res.success) {
              setSuccessBlue(true);
              setUploadingBlue(false);
            } else if (res.failure) {
              setFailureBlue(true);
              setUploadingBlue(false);
            }
          })
          .catch((error) => {
            console.error(error);
            console.log(" Some errors occured @ client ");
            setFailureBlue(true);
            setUploadingBlue(false);
          });
      } catch (err) {
        console.log(err);
        console.log("There was a problem with the server");
        setFailureBlue(true);
        setUploadingBlue(false);
      }
    });
  };

  const state_style = {
    success: {
      color: "green",
      display: "grid",
      placeItems: "center",
    },
    failure: {
      color: "red",
      display: "grid",
      placeItems: "center",
    },
    uploading: {
      color: "blue",
      display: "grid",
      placeItems: "center",
    },
  };
  // Initialize upload wording state variables
  let state; // For Taxi picture
  let state_profile;
  let state_licence;
  let state_id;
  let state_white;
  let state_permit;
  let state_blue;

  // *Upload state wordings
  // Taxi picture
  if (uploading) {
    state = (
      <h5 style={state_style.uploading} className="uploading">
        {" "}
        Uploading Taxi picture...
      </h5>
    );
  }
  if (success) {
    state = (
      <h5 style={state_style.success} className="upload-success">
        {" "}
        Success
      </h5>
    );
  }
  if (failure) {
    state = (
      <h5 style={state_style.failure} className="upload-failure">
        {" "}
        Failed{" "}
      </h5>
    );
  }

  // Profile picture
  if (uploading_profile) {
    state_profile = (
      <h5 style={state_style.uploading} className="uploading">
        {" "}
        Uploading profile picture...
      </h5>
    );
  }
  if (success_profile) {
    state_profile = (
      <h5 style={state_style.success} className="upload-success">
        {" "}
        Success
      </h5>
    );
  }
  if (failure_profile) {
    state_profile = (
      <h5 style={state_style.failure} className="upload-failure">
        {" "}
        Failed{" "}
      </h5>
    );
  }

  // Driver Licence
  if (uploading_licence) {
    state_licence = (
      <h5 style={state_style.uploading} className="uploading">
        {" "}
        Uploading driver's licence...
      </h5>
    );
  }
  if (success_licence) {
    state_licence = (
      <h5 style={state_style.success} className="upload-success">
        {" "}
        Success
      </h5>
    );
  }
  if (failure_licence) {
    state_licence = (
      <h5 style={state_style.failure} className="upload-failure">
        {" "}
        Failed{" "}
      </h5>
    );
  }

  // id paper
  if (uploading_id) {
    state_id = (
      <h5 style={state_style.uploading} className="uploading">
        {" "}
        Uploading Id...
      </h5>
    );
  }
  if (success_id) {
    state_id = (
      <h5 style={state_style.success} className="upload-success">
        {" "}
        Success
      </h5>
    );
  }
  if (failure_id) {
    state_id = (
      <h5 style={state_style.failure} className="upload-failure">
        {" "}
        Failed{" "}
      </h5>
    );
  }

  // white paper
  if (uploading_white) {
    state_white = (
      <h5 style={state_style.uploading} className="uploading">
        {" "}
        Uploading white_paper...
      </h5>
    );
  }
  if (success_white) {
    state_white = (
      <h5 style={state_style.success} className="upload-success">
        {" "}
        Success
      </h5>
    );
  }
  if (failure_white) {
    state_white = (
      <h5 style={state_style.failure} className="upload-failure">
        {" "}
        Failed{" "}
      </h5>
    );
  }

  // public permit
  if (uploading_permit) {
    state_permit = (
      <h5 style={state_style.uploading} className="uploading">
        {" "}
        Uploading public permit...
      </h5>
    );
  }
  if (success_permit) {
    state_permit = (
      <h5 style={state_style.success} className="upload-success">
        {" "}
        Success
      </h5>
    );
  }
  if (failure_permit) {
    state_permit = (
      <h5 style={state_style.failure} className="upload-failure">
        {" "}
        Failed{" "}
      </h5>
    );
  }

  // Blue Paper
  if (uploading_blue) {
    state_blue = (
      <h5 style={state_style.uploading} className="uploading">
        {" "}
        Uploading blue paper...
      </h5>
    );
  }
  if (success_blue) {
    state_blue = (
      <h5 style={state_style.success} className="upload-success">
        {" "}
        Success
      </h5>
    );
  }
  if (failure_blue) {
    state_blue = (
      <h5 style={state_style.failure} className="upload-failure">
        {" "}
        Failed{" "}
      </h5>
    );
  }

  // For
  let info_update_result;
  if (success_info) {
    info_update_result = (
      <AiOutlineCheckSquare
        style={{ width: 30, height: 30, color: "green", marginLeft: "5%" }}
      />
    );
  }
  if (uploadinginfo) {
    info_update_result = (
      <h5 className="uploading-info-anime">In progress...</h5>
    );
  }
  if (failure_info) {
    info_update_result = (
      <VscError
        style={{ width: 30, height: 30, color: "red", marginLeft: "5%" }}
      />
    );
  }

  //Form style
  const formStyle = {
    display: "grid",
    placeItems: "center",
  };

  let image_source = process.env.REACT_APP_TAXI_PICTURE_SRC + `/${car_image}`;

  const formControlDisplay = () => {
    setInfoFormState(!info_form_state);
  };

  /**
   *  SUSPEND DRIVER HANDLER
   */

  const suspendDriver = () => {
    setSuspensionLoading(true);
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        driverFingerPrint: queryString.parse(location.search).driverID,
      }),
    };

    fetch(`${process.env.REACT_APP_DRIVER_SERVER}/suspend-driver`, options)
      //fetch(`http://localhost:10020/suspend-driver`, options)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setSuspensionLoading(false);
          setSuspensionSuccess(true);
        } else if (data.error) {
          setSuspensionLoading(false);
          setSuspensionFailure(true);
        }
      });
  };

  const unsuspendDriver = () => {
    setSuspensionLoading(true);
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        driverFingerPrint: queryString.parse(location.search).driverID,
      }),
    };

    fetch(`${process.env.REACT_APP_DRIVER_SERVER}/unsuspend-driver`, options)
      //fetch(`http://localhost:10020/unsuspend-driver`, options)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setSuspensionLoading(false);
          setSuspensionSuccess(true);
        } else if (data.error) {
          setSuspensionLoading(false);
          setSuspensionFailure(true);
        }
      });
  };

  let suspension_result;
  if (suspension_success) {
    suspension_result = (
      <AiOutlineCheckSquare
        style={{ width: 30, height: 30, color: "green", marginLeft: "5%" }}
      />
    );
  }
  if (suspension_loading) {
    suspension_result = (
      <h5 className="uploading-info-anime">In progress...</h5>
    );
  }
  if (suspension_failure) {
    suspension_result = (
      <VscError
        style={{ width: 30, height: 30, color: "red", marginLeft: "5%" }}
      />
    );
  }

  return (
    <div className="template">
      <div className="main-content">
        <div id="profile-driver">
          <h2 style={{ display: "grid", placeItems: "center", padding: "2%" }}>
            {" "}
            DRIVER PROFILE{" "}
          </h2>
          {/* 
                <h1> { driverFingerPrint } </h1>
                <h5> { taxi_number } </h5>          
                */}
          <div className="profile-info-driver">
            <div>
              <img src={image_source} alt="Car Picture" />
            </div>
            <div>
              <form style={formStyle} onSubmit={onSubmitDriverInfo}>
                <div>
                  <label> Name </label>
                  <br></br>
                  <input
                    type="text"
                    className="my-input-field"
                    value={name}
                    disabled={info_form_state}
                    onChange={(e) => {
                      setName(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <label> Surname </label>
                  <br></br>
                  <input
                    type="text"
                    className="my-input-field"
                    value={surname}
                    disabled={info_form_state}
                    onChange={(e) => {
                      setSurname(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <label> Phone number </label>
                  <br></br>
                  <input
                    type="text"
                    className="my-input-field"
                    value={phone_number}
                    disabled={info_form_state}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <label> Taxi number </label>
                  <br></br>
                  <input
                    type="text"
                    className="my-input-field"
                    value={taxi_number}
                    disabled={info_form_state}
                    onChange={(e) => {
                      setTaxiNumber(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <label> Plate number </label>
                  <br></br>
                  <input
                    type="text"
                    className="my-input-field"
                    value={plate_number}
                    disabled={info_form_state}
                    onChange={(e) => {
                      setPlateNumber(e.target.value);
                    }}
                  />
                </div>
                <div style={{ display: "inline-block", width: "100%" }}>
                  <button
                    disabled={info_form_state}
                    className="btn btn-info btn-sm"
                    type="submit"
                  >
                    Update
                  </button>
                  {info_update_result}
                </div>
              </form>
              <button
                style={{ marginLeft: "80%" }}
                onClick={formControlDisplay}
                className="btn btn-warning btn-sm"
              >
                {info_form_state ? "Enable editing" : "Disable editing"}
              </button>
            </div>
          </div>
          {/* FILE UPLOAD OR UPDATE */}
          <div
            style={{ display: "grid", placeItems: "center", marginTop: "4%" }}
          >
            <h4
              style={{
                backgroundColor: "#0a0321",
                padding: "2%",
                color: "white",
              }}
            >
              {" "}
              UPLOAD / UPDATE FILES
            </h4>

            <form onSubmit={onSubmitTaxiPicture}>
              <div className="custom-file mt-4">
                <input
                  type="file"
                  className="custom-file-input"
                  id="customFile"
                  required
                  onChange={(e) => {
                    setTaxiPicture(e.target.files[0]);
                    setTaxiPictureName(e.target.files[0].name);
                  }}
                />
                <label
                  className="custom-file-label"
                  htmlFor="customFile"
                  style={{ overflow: "hidden" }}
                >
                  {taxi_picture_name}
                </label>
              </div>
              {state ? (
                state
              ) : (
                <div className="submit-registration">
                  <input
                    style={{ backgroundColor: "#03111a" }}
                    type="submit"
                    value="Upload"
                    className="btn btn-primary btn-block mt-4"
                  />
                </div>
              )}
            </form>

            <form onSubmit={onSubmitProfilePicture}>
              <div className="custom-file mt-4">
                <input
                  type="file"
                  className="custom-file-input"
                  id="customFile"
                  required
                  onChange={(e) => {
                    setProfilePicture(e.target.files[0]);
                    setProfilePictureName(e.target.files[0].name);
                  }}
                />
                <label
                  className="custom-file-label"
                  htmlFor="customFile"
                  style={{ overflow: "hidden" }}
                >
                  {profile_picture_name}
                </label>
              </div>
              {state_profile ? (
                state_profile
              ) : (
                <div className="submit-registration">
                  <input
                    style={{ backgroundColor: "#03111a" }}
                    type="submit"
                    value="Upload"
                    className="btn btn-primary btn-block mt-4"
                  />
                </div>
              )}
            </form>

            <form onSubmit={onSubmitDriverLicence}>
              <div className="custom-file mt-4">
                <input
                  type="file"
                  className="custom-file-input"
                  id="customFile"
                  required
                  onChange={(e) => {
                    setDriverLicenceDoc(e.target.files[0]);
                    setDriverLicenceDocName(e.target.files[0].name);
                  }}
                />
                <label
                  className="custom-file-label"
                  htmlFor="customFile"
                  style={{ overflow: "hidden" }}
                >
                  {driver_licence_doc_name}
                </label>
              </div>
              {state_licence ? (
                state_licence
              ) : (
                <div className="submit-registration">
                  <input
                    style={{ backgroundColor: "#03111a" }}
                    type="submit"
                    value="Upload"
                    className="btn btn-primary btn-block mt-4"
                  />
                </div>
              )}
            </form>

            <form onSubmit={onSubmitIdPaper}>
              <div className="custom-file mt-4">
                <input
                  type="file"
                  className="custom-file-input"
                  id="customFile"
                  required
                  onChange={(e) => {
                    setCopyIdPaper(e.target.files[0]);
                    setCopyIdPaperName(e.target.files[0].name);
                  }}
                />
                <label
                  className="custom-file-label"
                  htmlFor="customFile"
                  style={{ overflow: "hidden" }}
                >
                  {copy_id_paper_name}
                </label>
              </div>
              {state_id ? (
                state_id
              ) : (
                <div className="submit-registration">
                  <input
                    style={{ backgroundColor: "#03111a" }}
                    type="submit"
                    value="Upload"
                    className="btn btn-primary btn-block mt-4"
                  />
                </div>
              )}
            </form>

            <form onSubmit={onSubmitWhitePaper}>
              <div className="custom-file mt-4">
                <input
                  type="file"
                  className="custom-file-input"
                  id="customFile"
                  required
                  onChange={(e) => {
                    setCopyWhitepaper(e.target.files[0]);
                    setCopyWhitepaperName(e.target.files[0].name);
                  }}
                />
                <label
                  className="custom-file-label"
                  htmlFor="customFile"
                  style={{ overflow: "hidden" }}
                >
                  {copy_white_paper_name}
                </label>
              </div>
              {state_white ? (
                state_white
              ) : (
                <div className="submit-registration">
                  <input
                    style={{ backgroundColor: "#03111a" }}
                    type="submit"
                    value="Upload"
                    className="btn btn-primary btn-block mt-4"
                  />
                </div>
              )}
            </form>

            <form onSubmit={onSubmitPublicPermit}>
              <div className="custom-file mt-4">
                <input
                  type="file"
                  className="custom-file-input"
                  id="customFile"
                  required
                  onChange={(e) => {
                    setCopyPublicPermit(e.target.files[0]);
                    setCopyPublicPermitName(e.target.files[0].name);
                  }}
                />
                <label
                  className="custom-file-label"
                  htmlFor="customFile"
                  style={{ overflow: "hidden" }}
                >
                  {copy_public_permit_name}
                </label>
              </div>
              {state_permit ? (
                state_permit
              ) : (
                <div className="submit-registration">
                  <input
                    style={{ backgroundColor: "#03111a" }}
                    type="submit"
                    value="Upload"
                    className="btn btn-primary btn-block mt-4"
                  />
                </div>
              )}
            </form>

            <form onSubmit={onSubmitBluePaper}>
              <div className="custom-file mt-4">
                <input
                  type="file"
                  className="custom-file-input"
                  id="customFile"
                  required
                  onChange={(e) => {
                    setCopyBluePaper(e.target.files[0]);
                    setCopyBluePaperName(e.target.files[0].name);
                  }}
                />
                <label
                  className="custom-file-label"
                  htmlFor="customFile"
                  style={{ overflow: "hidden" }}
                >
                  {copy_blue_paper_name}
                </label>
              </div>
              {state_blue ? (
                state_blue
              ) : (
                <div className="submit-registration">
                  <input
                    style={{ backgroundColor: "#03111a" }}
                    type="submit"
                    value="Upload"
                    className="btn btn-primary btn-block mt-4"
                  />
                </div>
              )}
            </form>
          </div>

          <div
            style={{ display: "grid", placeItems: "center", marginTop: "4%" }}
          >
            <h4
              style={{
                backgroundColor: "#0a0321",
                padding: "2%",
                color: "white",
              }}
            >
              {" "}
              OTHER ACTIONS{" "}
            </h4>

            <table
              className="table-striped"
              style={{ border: "solid 1px", width: "60%" }}
            >
              <thead className="thead-light">
                <tr>
                  <th>Action Name</th>
                  <th>Options</th>
                  <th>Action Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontSize: "large" }}>
                    <span style={{ display: "grid", placeItems: "center" }}>
                      Suspension
                    </span>
                  </td>
                  <td style={{ fontSize: "large" }}>
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => suspendDriver()}
                      style={{ margin: "5px" }}
                    >
                      suspend
                    </button>
                    <br></br>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => unsuspendDriver()}
                    >
                      unsuspend
                    </button>
                  </td>
                  <td style={{ fontSize: "large" }}>
                    {" "}
                    {suspension_result
                      ? suspension_result
                      : "no action taken"}{" "}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
