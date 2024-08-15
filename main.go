package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"time"
)

const (
	outputDir = "data"
	fullPath  = "data/full"
	litePath  = "data/lite"
)

// fetchKeysFromURL fetches the content from the given URL and extracts keys
func fetchKeysFromURL(urlStr string, proxyURL *url.URL) ([]string, error) {
	var client *http.Client

	if proxyURL != nil {
		transport := &http.Transport{
			Proxy: http.ProxyURL(proxyURL),
		}
		client = &http.Client{Transport: transport}
	} else {
		client = &http.Client{}
	}

	response, err := client.Get(urlStr)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	// Regular expression to find keys in the format <code>key</code>
	pattern := `<code>([A-Za-z0-9-]+)</code>`
	re := regexp.MustCompile(pattern)
	matches := re.FindAllStringSubmatch(string(body), -1)

	var keys []string
	for _, match := range matches {
		keys = append(keys, match[1])
	}
	return keys, nil
}

// writeKeysToFile writes the list of keys to the specified file path
func writeKeysToFile(keys []string, path string) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	for i, key := range keys {
		if i > 0 {
			file.WriteString("\n")
		}
		file.WriteString(key)
	}
	return nil
}

func main() {
	proxy := flag.String("proxy", "", "HTTP or SOCKS5 proxy URL (e.g., http://proxy.example.com:8080 or socks5://localhost:1080)")
	flag.Parse()

	var proxyURL *url.URL
	if *proxy != "" {
		var err error
		proxyURL, err = url.Parse(*proxy)
		if err != nil {
			log.Fatalf("Invalid proxy URL: %v", err)
		}
	}

	sources := []string{
		"https://t.me/s/warpplus",
		"https://t.me/s/warppluscn",
		"https://t.me/s/warpPlusHome",
		"https://t.me/s/warp_veyke",
	}

	var allKeys []string
	for _, url := range sources {
		keys, err := fetchKeysFromURL(url, proxyURL)
		if err != nil {
			log.Printf("Error fetching keys from %s: %v", url, err)
			continue
		}
		allKeys = append(allKeys, keys...)
	}

	// Remove duplicates from the keys list
	uniqueKeys := make(map[string]struct{})
	for _, key := range allKeys {
		uniqueKeys[key] = struct{}{}
	}

	var keysList []string
	for key := range uniqueKeys {
		keysList = append(keysList, key)
	}

	if len(keysList) > 0 {
		// Create output directory if it does not exist
		if err := os.MkdirAll(outputDir, os.ModePerm); err != nil {
			log.Fatalf("Error creating directory %s: %v", outputDir, err)
		}

		// Generate full file with up to 100 keys
		x := 0
		var fullKeys []string
		for _, key := range keysList {
			if x >= 100 {
				break
			}
			fullKeys = append(fullKeys, key)
			x++
		}
		if err := writeKeysToFile(fullKeys, fullPath); err != nil {
			log.Fatalf("Error writing to file %s: %v", fullPath, err)
		}

		// Generate lite file with up to 15 keys, shuffled
		rand.Seed(time.Now().UnixNano())
		rand.Shuffle(len(keysList), func(i, j int) {
			keysList[i], keysList[j] = keysList[j], keysList[i]
		})

		i := 0
		var liteKeys []string
		for _, key := range keysList {
			if i >= 15 {
				break
			}
			liteKeys = append(liteKeys, key)
			i++
		}
		if err := writeKeysToFile(liteKeys, litePath); err != nil {
			log.Fatalf("Error writing to file %s: %v", litePath, err)
		}

		fmt.Println("successfully.")
	} else {
		fmt.Println("No keys found.")
	}
}
