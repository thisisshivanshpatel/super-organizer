import { styled } from "@mui/material/styles";
import LinearProgress, {
  linearProgressClasses,
} from "@mui/material/LinearProgress";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import { Button, Chip } from "@mui/material";
import { useState } from "react";

// Type definitions for Electron API
declare global {
  interface Window {
    electronAPI: {
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<boolean>;
      readDir: (dirPath: string) => Promise<string[]>;
      exists: (filePath: string) => Promise<boolean>;
      openFile: () => Promise<string | null>;
      saveFile: (content: string) => Promise<string | null>;
      platform: string;
    };
  }
}

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 20,
  borderRadius: 10,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: theme.palette.grey[200],
    ...theme.applyStyles("dark", {
      backgroundColor: theme.palette.grey[800],
    }),
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 10,
    backgroundColor: "#6FAF4F",
    ...theme.applyStyles("dark", {
      backgroundColor: "#6FAF4F",
    }),
  },
}));

export const Target = () => {
  const [number, setNumber] = useState<number>(30);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileList, setFileList] = useState<string[]>([]);

  // Example: Read a file
  const handleReadFile = async () => {
    try {
      const content = await window.electronAPI.readFile(
        "/tmp/electron-test/test.txt",
      );
      setFileContent(content);
      console.log("File content:", content);
    } catch (error) {
      console.error("Error reading file:", error);
    }
  };

  // Example: Write to a file
  const handleWriteFile = async () => {
    try {
      const success = await window.electronAPI.writeFile(
        "/tmp/electron-test/new-file.txt",
        "Hello from Electron!",
      );
      if (success) {
        console.log("File written successfully");
      }
    } catch (error) {
      console.error("Error writing file:", error);
    }
  };

  // Example: Read directory
  const handleReadDir = async () => {
    try {
      const files = await window.electronAPI.readDir("/tmp/electron-test");
      setFileList(files);
      console.log("Directory contents:", files);
    } catch (error) {
      console.error("Error reading directory:", error);
    }
  };

  // Example: Check if file exists
  const handleCheckFile = async () => {
    try {
      const exists = await window.electronAPI.exists(
        "/tmp/electron-test/test.txt",
      );
      console.log("File exists:", exists);
    } catch (error) {
      console.error("Error checking file:", error);
    }
  };

  // Example: Open file dialog
  const handleOpenFile = async () => {
    try {
      const filePath = await window.electronAPI.openFile();
      if (filePath) {
        console.log("Selected file:", filePath);
        const content = await window.electronAPI.readFile(filePath);
        setFileContent(content);
      }
    } catch (error) {
      console.error("Error opening file:", error);
    }
  };

  // Example: Save file dialog
  const handleSaveFile = async () => {
    try {
      const filePath = await window.electronAPI.saveFile(
        "Sample content to save",
      );
      if (filePath) {
        console.log("File saved to:", filePath);
      }
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };

  return (
    <div className="flex flex-col justify-center bg-[#FCBF49] p-4 rounded-3xl">
      <h1 className="font-mono font-bold text-amber-50">Emergency Fund</h1>
      <BorderLinearProgress variant="determinate" value={number} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          marginBottom: 4,
        }}
      >
        <Chip avatar={<CurrencyRupeeIcon />} label={number} />
        <Chip avatar={<CurrencyRupeeIcon />} label="100" />
      </div>
      <Button
        variant="contained"
        onClick={() =>
          setNumber((prev) => {
            if (prev !== 100) return prev + 10;
            else {
              return prev;
            }
          })
        }
      >
        Add Money
      </Button>

      {/* File System Operations */}
      <div className="mt-6 p-4 border border-gray-300 rounded-lg bg-white">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          File System Operations
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button onClick={handleReadFile} variant="outlined" size="small">
            Read File
          </Button>
          <Button onClick={handleWriteFile} variant="outlined" size="small">
            Write File
          </Button>
          <Button onClick={handleReadDir} variant="outlined" size="small">
            Read Directory
          </Button>
          <Button onClick={handleCheckFile} variant="outlined" size="small">
            Check File Exists
          </Button>
          <Button onClick={handleOpenFile} variant="outlined" size="small">
            Open File Dialog
          </Button>
          <Button onClick={handleSaveFile} variant="outlined" size="small">
            Save File Dialog
          </Button>
        </div>

        {fileContent && (
          <div className="mt-4 p-2 bg-gray-100 rounded">
            <h4 className="font-semibold">File Content:</h4>
            <pre className="text-sm whitespace-pre-wrap">{fileContent}</pre>
          </div>
        )}

        {fileList.length > 0 && (
          <div className="mt-4 p-2 bg-gray-100 rounded">
            <h4 className="font-semibold">Directory Contents:</h4>
            <ul className="text-sm">
              {fileList.map((file, index) => (
                <li key={index}>• {file}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
