#!/usr/bin/env python

import sys
import string
import os
import glob
import copy

# overwrite a single file, fixing the import lines
def lintImports(dir, filepath):
    itHasStarted = False
    intoCodeSection = False
    preLines = []
    importLines = []
    postLines = []
    # parse entire file
    for line in open(filepath, 'r').readlines():
        if (not intoCodeSection and line.lstrip().startswith('import')):
            itHasStarted = True
            importLines.append(line.lstrip().split(" "))
        else:
            if (line.startswith('contract') or line.startswith('library')):
                intoCodeSection = True
            if not itHasStarted:
                preLines.append(line)
            else:
                postLines.append(line)

    # remove unused import lines
    ogImportLines = copy.deepcopy(importLines);
    importLines = [x for x in importLines if any(x[2] in line for line in postLines)]

    # remove duplicate import lines
    temp = set()
    importLines = [x for x in importLines if x[2] not in temp and (temp.add(x[2]) or True)]

    # sort import lines
    sortedImportLines = []
    for line in importLines:
        sortedImportLines.append(line)
    sortedImportLines = sorted(
        sortedImportLines,
        key = lambda l:(
            l[5][1] == '.',
            os.path.dirname(l[5]),
            os.path.basename(l[5])
        )
    )

    if sortedImportLines != ogImportLines:
        niceFilePath = filepath.replace(dir, "protocol")
        if "fix" in sys.argv:
            print("modified " + niceFilePath)
            with open(filepath, 'w') as output:
                output.writelines(preLines)
                output.writelines(" ".join(line) for line in sortedImportLines)
                output.writelines(postLines)
        else:
            print("\nin file '" + niceFilePath +"':\n")
            print "".join([" ".join(x) for x in ogImportLines])
            print("\t>>> SHOULD BE >>>\n")
            print "".join([" ".join(x) for x in sortedImportLines])
            print ""
        return False
    return True


def lintCommentHeader(dir, filepath, solidityVersion):
    fileName = os.path.basename(filepath)
    strippedFileName = fileName.split(".sol")[0]
    titleLine = " * @title " + strippedFileName + "\n"
    authorLine = " * @author dYdX\n"
    blankLine = " *\n"
    solidityLine = "pragma solidity " + solidityVersion + ";\n"
    abiEncoderLine = "pragma experimental ABIEncoderV2;\n"
    allLines = open(filepath, 'r').readlines()

    everythingOkay = True
    if titleLine not in allLines:
        print "No title (or incorrect title) line in " + fileName
        everythingOkay = False
    if authorLine not in allLines:
        print "No author (or incorrect author) line in " + fileName
        everythingOkay = False
    if blankLine not in allLines:
        print "Unlikely to be a proper file-level comment in " + fileName
        everythingOkay = False
    if solidityLine not in allLines:
        print "Unlikely to be using solidity version " + solidityVersion + " in " + fileName
        everythingOkay = False
    if abiEncoderLine not in allLines:
        print "Must use ABIEncoderV2 in " + fileName
        everythingOkay = False

    return everythingOkay


def lintFunctionComments(dir, filepath):
    fileName = os.path.basename(filepath)
    everythingOkay = True
    inBlockComment = False
    seenBlank = False
    alreadyComplained = False
    argColumn = 0
    i = 1
    for line in open(filepath, 'r').readlines():
        words = line.split()
        errorSuffix = " (" + fileName + ":" + str(i) + ")"
        lstripped = line.lstrip()

        # check for extra statements
        if ('param ' in lstripped and 'param  ' not in lstripped):
            everythingOkay = False
            print "Param has only one space" + errorSuffix
        if ('param   ' in lstripped):
            everythingOkay = False
            print "Param has more than two spaces" + errorSuffix

        # start block comment
        if (not inBlockComment and lstripped.startswith('/**')):
            argColumn = 0
            inBlockComment = True
            seenBlank = False
            alreadyComplained = False

        # check for aligned parameters
        if (inBlockComment):
            col = 0
            if ('param ' in lstripped and len(words) >= 4):
                col = line.find(' '+words[3]) + 1
            if ('@returns' in lstripped):
                col = line.find(words[2])
            if (col > 0):
                if (argColumn == 0):
                    argColumn = col
                else:
                    if (col != argColumn):
                        everythingOkay = False
                        print "Params not aligned to column " + str(argColumn + 1) + errorSuffix

        # blank comment line
        if (inBlockComment and lstripped.rstrip() == '*'):
            seenBlank = True

        # make sure a blank comment line has been found before parameter list
        if (inBlockComment and not seenBlank):
            if ('*  param' in lstripped or '* @param' in lstripped):
                if (not alreadyComplained):
                    alreadyComplained = True
                    everythingOkay = False
                    print "No blank line before param list in function comment" + errorSuffix

        # end block comment
        if (inBlockComment and line.rstrip().endswith('*/')):
            inBlockComment = False
        i += 1

    return everythingOkay


def main():
    files = []
    start_dir = os.getcwd()
    pattern = "*.sol"

    dir_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    contracts_path = dir_path + "/contracts"

    for dir, _, _ in os.walk(contracts_path):
        files.extend(glob.glob(os.path.join(dir, pattern)))

    whitelistedFiles = open(dir_path + "/.soliumignore", 'r').readlines()
    whitelistedFiles = [x.strip() for x in whitelistedFiles]

    files = [x for x in files if not any(white in x for white in whitelistedFiles)]

    everythingOkay = True
    for file in files:
        everythingOkay &= lintFunctionComments(dir_path, file)
        everythingOkay &= lintImports(dir_path, file)
        everythingOkay &= lintCommentHeader(dir_path, file, "0.5.7")

    if everythingOkay:
        print "No contract linting issues found."

    sys.exit(0 if everythingOkay else 1)


if __name__ == "__main__":
    main()
