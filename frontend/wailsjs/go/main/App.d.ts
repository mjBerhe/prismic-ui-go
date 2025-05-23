// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
import {main} from '../models';

export function CopyFileToDownloads(arg1:string,arg2:string):Promise<string>;

export function ExecutePalm(arg1:string,arg2:string,arg3:string):Promise<void>;

export function ExecutePythonScript(arg1:string,arg2:Array<string>):Promise<string>;

export function GetFilenames(arg1:string):Promise<Array<string>>;

export function GetLiabilityConfigs(arg1:string):Promise<Array<main.LiabilityConfigData>>;

export function OpenFile(arg1:string):Promise<void>;

export function OpenFileDialog(arg1:main.FileDialogOptions):Promise<string>;

export function ReadFiles(arg1:string,arg2:string,arg3:boolean):Promise<Array<main.CSVFile>>;

export function ReadScenarioConfig(arg1:string):Promise<main.ScenarioConfig>;

export function ReadUIConfig():Promise<main.Config>;

export function WriteJsonFile(arg1:string,arg2:string):Promise<void>;
