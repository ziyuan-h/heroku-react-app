import './App.css';
import React from 'react';

// atob is deprecated but this function converts base64string to text string
const decodeFileBase64 = (base64String) => {
  // From Bytestream to Percent-encoding to Original string
  return decodeURIComponent(
    atob(base64String).split("").map(function (c) {
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join("")
  );
};


function App() {
  const apiUrl = 'https://l5c29682bl.execute-api.us-east-1.amazonaws.com/dev/';

  const [buttonDisable, setButtonDisable] = React.useState(false);
  const [buttonText, setButtonText] = React.useState('Submit');

  // input parameters
  const [initialMoney, setInitialMoney] = React.useState('1000');
  const [timeRange, setTimeRange] = React.useState('year');
  const [company, setCompany] = React.useState('goog');
  // output console
  const [outputImg, setOutputImg] = React.useState("/images/digit.png")
  const [hiddenImg, setHiddenImg] = React.useState(true);
  const [outputConsole, setOutputConsole] = React.useState("output");
  const [buyOutput, setBuyOutput] = React.useState("");
  const [sellOutput, setSellOutput] = React.useState("");
  // debug use
  const [textBox, setTextBox] = React.useState("debug");

//   // initial setup, hide the image
//   document.getElementById("Image").style.display = "none";

  // sleep helper
  const sleepHelper = ms => new Promise(r => setTimeout(r, ms));
  
  // date convert helper
  const dateConverter = (numDaysBefore) => {
      let today = new Date();
      let pastDate = new Date(today.setDate(today.getDate() + numDaysBefore));
      let strPastDate = pastDate.getFullYear() + '-' + ('0' + (pastDate.getMonth()+1)).slice(-2) + '-' + ('0' + pastDate.getDate()).slice(-2);
      return strPastDate;
  }

  // handle initial money input
  const inputInitialMoney = async (event) => {
    setInitialMoney(event.target.value);
  }

  // handle time range input
  const inputTimeRange = async (event) => {  
    var list = document.getElementById("selectTimeRange");  
    setTimeRange(list.options[list.selectedIndex].value);  
  } 

  // handle company input
  const inputCompany = async (event) => {
    var list = document.getElementById("selectCompany"); 
    setCompany(list.options[list.selectedIndex].value);
  }

  // parse txt result
  const parseResultText = (resultTextJson) => {
    let outputBuyIn = "";
    let buyArray = resultTextJson["buy"];
    let sellArray = resultTextJson["sell"];
    for (let i = 0; i < buyArray.length; i++) {
      outputBuyIn += dateConverter(buyArray[i]);
      if (i < buyArray.length - 1) {
        outputBuyIn += ', ';
      } else {
        outputBuyIn += '.';
      }
    }
    setBuyOutput(outputBuyIn);
    outputBuyIn = "";
    for (let i = 0; i < sellArray.length; i++) {
      outputBuyIn += dateConverter(sellArray[i]);
      if (i < sellArray.length - 1) {
        outputBuyIn += ', ';
      } else {
        outputBuyIn += '.';
      }
    }
    setSellOutput(outputBuyIn);
  }

  // parse image result
  const parseResultImage = (resultImgBytes) => {
    // document.getElementById("ItemPreview").src = "data:image/jpg;base64," + btoa(encodeURI(resultImgBytes));
    setHiddenImg(false);
    setOutputImg("data:image/jpeg;charset=utf-8;base64," + encodeURI(resultImgBytes))
  }

  // asynchronous function to handle http GET request to api url
  // accept "resultRecieved", returns the same promise
  const handleHttpGETRequest = async (resultReceived) => {
    if (resultReceived) {
      // re-enable submit button
      setButtonDisable(false);
      setButtonText('Submit');
    } 
    
    else {
      // setTimeout(() => {console.log("timeout in 15 seconds")}, 15000); // wait for every 15 seconds
      await sleepHelper(15000); // wait for every 15 seconds
      console.log("timeout in 15 seconds");

      const response = await fetch(apiUrl);
      const data = await response.json();

      // GET request succeeded
      if (data.statusCode == 200) {
        // retrive the results from response
        var imageBytesData = data.body.result_img;
        var textData = data.body.result_txt;
        console.log(data.body);
        console.log(imageBytesData);
        console.log(textData);

        // parse the result image
        parseResultImage(imageBytesData);

        // parse the result text
        parseResultText(textData);

        // end the while loop
        resultReceived = true;
      }
    }

    return resultReceived;
  }

  // create a chain of GET requests
  const createChainOfGETs = async (num, resultReceived) => {
    for (let i = 0; i < num; i++) {
      setOutputConsole(i.toString()+" GET requests created.");
      resultReceived = await handleHttpGETRequest(resultReceived);
      if (resultReceived) {
        console.log("GET result received!");

        // re-enable submit button
        setButtonDisable(false);
        setButtonText('Submit');
        break;
      }
    }
  }

  // handle submit
  const handleSubmitDebug = (event) => {
    event.preventDefault();

    // hide old result
    setHiddenImg(true);

    // update debug message
    const debugMessage = timeRange+','+company+','+initialMoney;
    setTextBox(debugMessage);

    // temporarily disable the submit button
    setButtonDisable(true);
    setButtonText('Loading Result');

    // make POST request
    console.log('making POST request...');
    fetch(apiUrl, {
      method: 'POST',
      headers: { "Content-Type": "application/json", "Accept": "text/plain" },
      body: JSON.stringify({ "model_params": timeRange+','+company+','+initialMoney })
    }).then(response => response.json())
    .then(data => {
      console.log('getting response...');
      console.log(data);

      // POST request error
      if (data.statusCode === 400) {
        const outputErrorMessage = JSON.parse(data.errorMessage)['outputResultsData'];
        setOutputConsole(outputErrorMessage);
        console.log("fail to submit POST request")

        // re-enable submit button
        setButtonDisable(false);
        setButtonText('Submit');
      }

      // POST request success
      else {
        console.log("successfully submitted POST request, trying to GET result...")
        setOutputConsole("Input submitted successfully.\n Waiting for training results......")

        // start submitting GET requests and wait for the results to be downloaded
        let resultReceived = false;

        // as most as 240 GET requests (wait for at most 4 min)
        createChainOfGETs(50, resultReceived);

      }
    })
  }
  
  return (
    <div className="App">
    <textarea >Resize me for some magic! ✨ </textarea>
                <h2>Input</h2>
    
              <div>
                <label htmlFor="selectTimeRange">Select time range from the list: </label>  
                <select id="selectTimeRange" onChange={inputTimeRange} required >  
                  <option value="year"> year </option>  
                  <option value="month"> month </option>  
                  <option value="week"> week </option>   
                </select>
                <span className="validity"></span>
              </div>


              <div>
                <label htmlFor="selectCompany">Select company from the list: </label>  
                <select id="selectCompany" onChange={inputCompany} required>  
                  <option value="goog"> Google </option>
                  <option value="txg"> 10x Genomics </option>
                  <option value="amba"> Ambarella </option>
                  <option value="amzn"> Amazon </option>
                  <option value="aapl"> Apple </option>
                </select>
                <span className="validity"></span>
              </div>



          <form onSubmit={handleSubmitDebug}>
              <div>
                <label htmlFor="initial_money">Initial money to invest (from 1000 to 1e6): </label>
                <input id="initial_money" type="number" name="initial_money" min="1000" max="1000000" step="100" required
                    placeholder="e.g. 1000" onChange={inputInitialMoney} />
                <span className="validity"></span>
              </div>

            <div>

<button type="submit" disabled={buttonDisable}><span>{buttonText}</span><img src="https://i.cloudup.com/2ZAX3hVsBE-3000x3000.png" height="62" width="62" /></button>
            </div>
          </form>
    
   






<h2>Results</h2>


          <p>
            {outputConsole}
          </p>
<div className="TextOutput" hidden={hiddenImg}>
<div>
          <p>
            <b>Agent buys in on dates: </b><br/>{buyOutput}<br/><br/>
            <b>Agent sells out on dates: </b><br/>{sellOutput}<br/><br/>
          </p>
          </div>
        <div className="child">
          <img id="Image" src={outputImg} alt="result figure" hidden={hiddenImg} />
        </div>
    
    </div>
</div>
    
  );
}

export default App;
